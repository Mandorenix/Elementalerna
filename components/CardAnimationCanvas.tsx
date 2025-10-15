import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Element, EventCard } from '../types';
import { ELEMENT_ICONS, elementThemes } from '../constants';

interface CardAnimationCanvasProps {
    deckCount: number;
    discardCount: number; // New prop for discard pile count
    drawnCardData: EventCard | null;
    resolvedCardsInMiddle: EventCard[]; // New prop for cards in the middle stack
    onDrawCard: () => void;
    onCardAnimationComplete: (card: EventCard) => void;
    onAllCardsMovedToDiscard: () => void; // New callback for when all cards move to discard
}

const CardAnimationCanvas: React.FC<CardAnimationCanvasProps> = ({
    deckCount,
    discardCount,
    drawnCardData,
    resolvedCardsInMiddle,
    onDrawCard,
    onCardAnimationComplete,
    onAllCardsMovedToDiscard,
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const scene = useRef(new THREE.Scene());
    const camera = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
    const renderer = useRef<THREE.WebGLRenderer | null>(null);

    const deckGroup = useRef(new THREE.Group()); // Group for the deck stack
    const drawnCardAnimatingMesh = useRef<THREE.Mesh | null>(null); // The single card currently animating
    const middleStackGroup = useRef(new THREE.Group()); // Group for resolved cards in the middle
    const discardPileGroup = useRef(new THREE.Group()); // Group for the discard pile

    const [isAnimatingDraw, setIsAnimatingDraw] = useState(false);
    const [isAnimatingToDiscard, setIsAnimatingToDiscard] = useState(false);

    const cardWidth = 1.5;
    const cardHeight = 2.2;
    const cardDepth = 0.05;
    const cardStackOffset = 0.01; // Small offset for stacking cards

    // Load textures for card back
    const textureLoader = new THREE.TextureLoader();
    const cardBackTexture = textureLoader.load('/card_back.png'); // You'll need to add this image

    // Function to create a simple colored texture for card front based on element
    const createElementalCardFrontTexture = useCallback((element: Element) => {
        const themeClass = elementThemes[element] || elementThemes[Element.NEUTRAL];
        const colorMatch = themeClass.match(/border-([a-z]+-\d+)/);
        let color = '#cccccc'; // Default gray
        if (colorMatch) {
            switch (colorMatch[1]) {
                case 'red-500': color = '#ef4444'; break;
                case 'green-500': color = '#22c55e'; break;
                case 'sky-500': color = '#0ea5e9'; break;
                case 'blue-500': color = '#3b82f6'; break;
                case 'orange-500': color = '#f97316'; break;
                case 'slate-500': color = '#64748b'; break;
                case 'amber-500': color = '#f59e0b'; break;
                case 'yellow-500': color = '#facc15'; break;
                case 'yellow-400': color = '#facc15'; break;
                case 'rose-400': color = '#fb7185'; break;
                case 'yellow-700': color = '#a16207'; break;
                case 'amber-700': color = '#b45309'; break;
                case 'stone-600': color = '#57534e'; break;
                case 'lime-600': color = '#4d7c0f'; break;
                case 'cyan-400': color = '#22d3ee'; break;
                case 'indigo-500': color = '#6366f1'; break;
                case 'red-600': color = '#dc2626'; break;
                case 'lime-500': color = '#84cc16'; break;
                case 'teal-500': color = '#14b8a6'; break;
                case 'purple-500': color = '#a855f7'; break;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256 * (cardHeight / cardWidth); // Maintain aspect ratio
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Add element icon (simplified for now, just a colored square)
        ctx.fillStyle = 'white';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = color;
        ctx.fillRect(canvas.width / 4 + 5, canvas.height / 4 + 5, canvas.width / 2 - 10, canvas.height / 2 - 10);


        return new THREE.CanvasTexture(canvas);
    }, [cardHeight, cardWidth, elementThemes]);


    useEffect(() => {
        if (!mountRef.current) return;

        // Initialize Renderer
        renderer.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.current.setClearColor(0x000000, 0); // Transparent background
        mountRef.current.appendChild(renderer.current.domElement);

        // Camera setup (adjusted for better view of left deck, middle, right discard)
        camera.current.position.set(0, 1.5, 4); // Slightly higher, further back
        camera.current.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.current.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 5, 5);
        scene.current.add(directionalLight);

        // Add groups to scene
        scene.current.add(deckGroup.current);
        scene.current.add(middleStackGroup.current);
        scene.current.add(discardPileGroup.current);

        // Initial deck visual (a single mesh representing the stack)
        const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
        const cardBackMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
        const cardSideMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

        const deckVisualMesh = new THREE.Mesh(cardGeometry, [
            cardSideMaterial, // Right
            cardSideMaterial, // Left
            cardBackMaterial, // Top (visible part of the stack)
            cardBackMaterial, // Bottom
            cardBackMaterial, // Front
            cardSideMaterial, // Back
        ]);
        deckVisualMesh.position.set(-2.5, 0, 0); // Position the deck on the left
        deckGroup.current.add(deckVisualMesh);

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
    }, [cardBackTexture]);

    // Update deck visual thickness
    useEffect(() => {
        if (deckGroup.current.children.length > 0) {
            const deckVisualMesh = deckGroup.current.children[0] as THREE.Mesh;
            deckVisualMesh.scale.z = Math.max(0.1, deckCount * cardStackOffset * 5); // Scale thickness based on count
            deckVisualMesh.position.z = -deckVisualMesh.scale.z / 2; // Adjust position to keep front aligned
            deckVisualMesh.visible = deckCount > 0;
        }
    }, [deckCount]);

    // Update middle stack visuals
    useEffect(() => {
        // Clear existing cards in the middle stack
        while (middleStackGroup.current.children.length > 0) {
            middleStackGroup.current.remove(middleStackGroup.current.children[0]);
        }

        // Add new cards to the middle stack
        resolvedCardsInMiddle.forEach((card, index) => {
            const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
            const cardFrontTexture = createElementalCardFrontTexture(card.element);
            const cardFrontMaterial = new THREE.MeshBasicMaterial({ map: cardFrontTexture });
            const cardBackMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
            const cardSideMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

            const cardMesh = new THREE.Mesh(cardGeometry, [
                cardSideMaterial, // Right
                cardSideMaterial, // Left
                cardFrontMaterial, // Top
                cardBackMaterial, // Bottom
                cardFrontMaterial, // Front
                cardSideMaterial, // Back
            ]);

            cardMesh.position.set(0, 0, index * cardStackOffset); // Stack in the middle
            cardMesh.rotation.y = Math.PI; // Ensure it's flipped to show front
            middleStackGroup.current.add(cardMesh);
        });
    }, [resolvedCardsInMiddle, createElementalCardFrontTexture, cardBackTexture]);

    // Update discard pile visuals
    useEffect(() => {
        // Clear existing cards in the discard pile
        while (discardPileGroup.current.children.length > 0) {
            discardPileGroup.current.remove(discardPileGroup.current.children[0]);
        }

        // Add new cards to the discard pile
        for (let i = 0; i < discardCount; i++) {
            const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
            const cardBackMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
            const cardSideMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

            const cardMesh = new THREE.Mesh(cardGeometry, [
                cardSideMaterial, // Right
                cardSideMaterial, // Left
                cardBackMaterial, // Top
                cardBackMaterial, // Bottom
                cardBackMaterial, // Front
                cardSideMaterial, // Back
            ]);

            cardMesh.position.set(2.5, 0, i * cardStackOffset); // Stack on the right
            discardPileGroup.current.add(cardMesh);
        }
    }, [discardCount, cardBackTexture]);


    // Handle card drawing animation
    const triggerDrawAnimation = useCallback(async () => {
        if (isAnimatingDraw || deckCount === 0 || !deckGroup.current.children[0]) return;

        setIsAnimatingDraw(true);
        onDrawCard(); // Trigger the game logic to draw a card

        const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
        const cardBackMaterial = new THREE.MeshBasicMaterial({ map: cardBackTexture });
        const cardSideMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

        // Create a new mesh for the card being animated
        drawnCardAnimatingMesh.current = new THREE.Mesh(cardGeometry, [
            cardSideMaterial, // Right
            cardSideMaterial, // Left
            cardBackMaterial, // Top
            cardBackMaterial, // Bottom
            cardBackMaterial, // Front (initially back)
            cardSideMaterial, // Back
        ]);
        scene.current.add(drawnCardAnimatingMesh.current);

        const startPos = deckGroup.current.children[0].position.clone().add(deckGroup.current.position);
        const midPos = new THREE.Vector3(0, 1, 0); // Mid-air position
        const endPos = new THREE.Vector3(0, 0, resolvedCardsInMiddle.length * cardStackOffset); // Landing position in middle stack

        drawnCardAnimatingMesh.current.position.copy(startPos);
        drawnCardAnimatingMesh.current.rotation.set(0, 0, 0);

        const duration = 1000; // milliseconds
        const startTime = Date.now();

        while (Date.now() - startTime < duration) {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (drawnCardAnimatingMesh.current) {
                // Lift and move
                drawnCardAnimatingMesh.current.position.lerpVectors(startPos, midPos, progress * 2);
                if (progress > 0.5) {
                    drawnCardAnimatingMesh.current.position.lerpVectors(midPos, endPos, (progress - 0.5) * 2);
                }

                // Rotate (flip)
                drawnCardAnimatingMesh.current.rotation.y = Math.PI * progress;

                // Update materials for flipping effect
                if (progress > 0.5 && drawnCardData) {
                    const cardFrontTexture = createElementalCardFrontTexture(drawnCardData.element);
                    const frontMaterial = new THREE.MeshBasicMaterial({ map: cardFrontTexture });
                    (drawnCardAnimatingMesh.current.material as THREE.Material[])[4] = frontMaterial; // Front face
                } else {
                    (drawnCardAnimatingMesh.current.material as THREE.Material[])[4] = cardBackMaterial;
                }
            }
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        // Ensure final state
        if (drawnCardAnimatingMesh.current) {
            drawnCardAnimatingMesh.current.position.copy(endPos);
            drawnCardAnimatingMesh.current.rotation.y = Math.PI; // Fully flipped
            scene.current.remove(drawnCardAnimatingMesh.current); // Remove animating mesh
            drawnCardAnimatingMesh.current = null;
        }

        setIsAnimatingDraw(false);
        if (drawnCardData) {
            onCardAnimationComplete(drawnCardData);
        }
    }, [isAnimatingDraw, deckCount, onDrawCard, drawnCardData, onCardAnimationComplete, resolvedCardsInMiddle.length, cardBackTexture, createElementalCardFrontTexture]);

    // Function to animate all cards from middle to discard pile
    const animateCardsToDiscard = useCallback(async () => {
        if (isAnimatingToDiscard || resolvedCardsInMiddle.length === 0) return;

        setIsAnimatingToDiscard(true);

        const cardsToAnimate = [...middleStackGroup.current.children]; // Get all cards from middle
        const durationPerCard = 200; // milliseconds

        for (let i = 0; i < cardsToAnimate.length; i++) {
            const cardMesh = cardsToAnimate[i] as THREE.Mesh;
            const startPos = cardMesh.position.clone().add(middleStackGroup.current.position);
            const endPos = new THREE.Vector3(2.5, 0, (discardCount + i) * cardStackOffset); // Land on discard pile

            const startTime = Date.now();
            while (Date.now() - startTime < durationPerCard) {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / durationPerCard;
                cardMesh.position.lerpVectors(startPos, endPos, progress);
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            cardMesh.position.copy(endPos); // Ensure final position
            cardMesh.rotation.y = 0; // Flip back to show card back
            (cardMesh.material as THREE.Material[])[4] = new THREE.MeshBasicMaterial({ map: cardBackTexture }); // Set to back texture
            discardPileGroup.current.add(cardMesh); // Move to discard group
            middleStackGroup.current.remove(cardMesh); // Remove from middle group
        }

        setIsAnimatingToDiscard(false);
        onAllCardsMovedToDiscard(); // Notify parent that all cards are moved
    }, [isAnimatingToDiscard, resolvedCardsInMiddle.length, discardCount, cardBackTexture, onAllCardsMovedToDiscard]);

    // Expose animateCardsToDiscard to parent component
    React.useImperativeHandle(mountRef, () => ({
        animateCardsToDiscard,
    }));

    return (
        <div ref={mountRef} className="w-full h-full relative">
            <button
                onClick={triggerDrawAnimation}
                disabled={isAnimatingDraw || deckCount === 0}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold pixelated-border z-10"
            >
                {isAnimatingDraw ? "Drager kort..." : (deckCount === 0 ? "Däck tomt" : "Dra ett kort")}
            </button>
            {deckCount === 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-1/4 text-yellow-300 text-lg text-center z-10">
                    Däck tomt!
                </div>
            )}
        </div>
    );
};

export default CardAnimationCanvas;