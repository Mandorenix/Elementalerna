import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Element, EventCard } from '../types';
import { ELEMENT_ICONS } from '../constants';

interface CardAnimationCanvasProps {
    deckCount: number;
    drawnCardData: EventCard | null;
    onDrawCard: () => void;
    onCardAnimationComplete: (card: EventCard) => void;
}

const CardAnimationCanvas: React.FC<CardAnimationCanvasProps> = ({ deckCount, drawnCardData, onDrawCard, onCardAnimationComplete }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const scene = useRef(new THREE.Scene());
    const camera = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
    const renderer = useRef<THREE.WebGLRenderer | null>(null);
    const deckMesh = useRef<THREE.Mesh | null>(null);
    const drawnCardMesh = useRef<THREE.Mesh | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const cardWidth = 1.5;
    const cardHeight = 2.2;
    const cardDepth = 0.05;

    // Load textures for card back and a placeholder front
    const textureLoader = new THREE.TextureLoader();
    const cardBackTexture = textureLoader.load('/card_back.png'); // You'll need to add this image
    const placeholderFrontTexture = textureLoader.load('/card_front_placeholder.png'); // You'll need to add this image

    useEffect(() => {
        if (!mountRef.current) return;

        // Initialize Renderer
        renderer.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.current.setClearColor(0x000000, 0); // Transparent background
        mountRef.current.appendChild(renderer.current.domElement);

        // Camera setup
        camera.current.position.z = 3;
        camera.current.position.y = 0.5;
        camera.current.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.current.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 5, 5);
        scene.current.add(directionalLight);

        // Card Geometry and Material
        const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
        const cardBackMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
        const cardFrontMaterial = new THREE.MeshBasicMaterial({ map: placeholderFrontTexture }); // Placeholder for now
        const cardSideMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

        // Create the deck mesh (a stack of cards)
        deckMesh.current = new THREE.Mesh(cardGeometry, [
            cardSideMaterial, // Right
            cardSideMaterial, // Left
            cardFrontMaterial, // Top (will be hidden by other cards)
            cardBackMaterial, // Bottom (will be hidden by other cards)
            cardBackMaterial, // Front
            cardSideMaterial, // Back
        ]);
        deckMesh.current.position.set(-1.5, 0, 0); // Position the deck
        scene.current.add(deckMesh.current);

        // Create the drawn card mesh (initially hidden)
        drawnCardMesh.current = new THREE.Mesh(cardGeometry, [
            cardSideMaterial,
            cardSideMaterial,
            cardFrontMaterial,
            cardBackMaterial,
            cardBackMaterial,
            cardSideMaterial,
        ]);
        drawnCardMesh.current.position.set(0, -10, 0); // Hide it initially
        scene.current.add(drawnCardMesh.current);

        const animate = () => {
            requestAnimationFrame(animate);
            if (renderer.current) {
                renderer.current.render(scene.current, camera.current);
            }
        };
        animate();

        const handleResize = () => {
            if (mountRef.current && renderer.current) {
                const width = mountRef.current.clientWidth;
                const height = mountRef.current.clientHeight;
                renderer.current.setSize(width, height);
                camera.current.aspect = width / height;
                camera.current.updateProjectionMatrix();
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.current) {
                mountRef.current.removeChild(renderer.current.domElement);
                renderer.current.dispose();
            }
        };
    }, []);

    // Handle card drawing animation
    const triggerDrawAnimation = useCallback(async () => {
        if (isAnimating || deckCount === 0 || !deckMesh.current || !drawnCardMesh.current) return;

        setIsAnimating(true);
        onDrawCard(); // Trigger the game logic to draw a card

        const startPos = deckMesh.current.position.clone();
        const midPos = new THREE.Vector3(0, 1, 0); // Mid-air position
        const endPos = new THREE.Vector3(1.5, 0, 0); // Landing position

        // Reset drawn card to deck position and make visible
        drawnCardMesh.current.position.copy(startPos);
        drawnCardMesh.current.rotation.set(0, 0, 0);
        drawnCardMesh.current.visible = true;

        // Animation loop
        const duration = 1000; // milliseconds
        const startTime = Date.now();

        while (Date.now() - startTime < duration) {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Lift and move
            drawnCardMesh.current.position.lerpVectors(startPos, midPos, progress * 2); // Move faster to mid-air
            if (progress > 0.5) {
                drawnCardMesh.current.position.lerpVectors(midPos, endPos, (progress - 0.5) * 2); // Move from mid-air to end
            }

            // Rotate (flip)
            drawnCardMesh.current.rotation.y = Math.PI * progress; // Rotate 180 degrees

            // Update materials for flipping effect
            if (progress > 0.5) {
                // After half rotation, show front texture
                const frontMaterial = new THREE.MeshBasicMaterial({ map: placeholderFrontTexture });
                (drawnCardMesh.current.material as THREE.Material[])[4] = frontMaterial; // Assuming front face is index 4
            } else {
                // Before half rotation, show back texture
                const backMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
                (drawnCardMesh.current.material as THREE.Material[])[4] = backMaterial;
            }

            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        // Ensure final state
        drawnCardMesh.current.position.copy(endPos);
        drawnCardMesh.current.rotation.y = Math.PI; // Fully flipped

        setIsAnimating(false);
        if (drawnCardData) {
            onCardAnimationComplete(drawnCardData);
        }
    }, [isAnimating, deckCount, onDrawCard, drawnCardData, onCardAnimationComplete, cardBackTexture, placeholderFrontTexture]);

    // Trigger animation when drawnCardData changes (meaning a card was drawn by game logic)
    useEffect(() => {
        if (drawnCardData && !isAnimating) {
            // This useEffect will now only update the texture of the drawn card
            // The animation itself is triggered by the button click.
            // We need to ensure the drawnCardMesh has the correct texture once the animation is complete.
            const Icon = drawnCardData.icon;
            // For now, we'll just use the placeholder.
            // In a real scenario, you'd dynamically generate a texture from the icon or a card image.
        }
    }, [drawnCardData, isAnimating]);

    return (
        <div ref={mountRef} className="w-full h-full relative">
            <button
                onClick={triggerDrawAnimation}
                disabled={isAnimating || deckCount === 0}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold pixelated-border z-10"
            >
                {isAnimating ? "Drager kort..." : (deckCount === 0 ? "Däck tomt" : "Dra ett kort")}
            </button>
        </div>
    );
};

export default CardAnimationCanvas;