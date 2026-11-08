import React, { useRef, useState, useEffect } from 'react';

interface BackgroundMusicProps {
    src: string;
    volume?: number;
    loop?: boolean;
    startPlaying?: boolean;
    initialPosition?: number;
    onPositionChange?: (position: number) => void;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ src, volume = 0.3, loop = true, startPlaying = false, initialPosition = 0, onPositionChange }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const positionIntervalRef = useRef<number | null>(null);
    const initialPositionRef = useRef(initialPosition);

    useEffect(() => {
        initialPositionRef.current = initialPosition;
    }, [initialPosition]);

    useEffect(() => {
        if (!src) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            return;
        }

        const audio = new Audio(src);
        audio.loop = loop;
        audio.volume = volume;
        audio.muted = isMuted;
        
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = audio;

        let played = false;
        const attemptPlay = () => {
            if (!played && startPlaying) {
                audio.play().then(() => {
                    played = true;
                    setHasStarted(true);
                    document.removeEventListener('click', attemptPlay);
                    document.removeEventListener('keydown', attemptPlay);
                }).catch(() => {});
            }
        };

        const seekToPosition = () => {
            const pos = initialPositionRef.current;
            if (pos > 0 && audio.duration && pos < audio.duration) {
                audio.currentTime = pos;
            }
        };

        if (startPlaying) {
            audio.addEventListener('loadedmetadata', seekToPosition);
            audio.play().then(() => {
                played = true;
                setHasStarted(true);
            }).catch(() => {
                document.addEventListener('click', attemptPlay);
                document.addEventListener('keydown', attemptPlay);
            });
        }

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('loadedmetadata', seekToPosition);
            document.removeEventListener('click', attemptPlay);
            document.removeEventListener('keydown', attemptPlay);
        };
    }, [src, loop, volume, startPlaying]);

    useEffect(() => {
        if (onPositionChange && startPlaying && hasStarted && audioRef.current) {
            const interval = window.setInterval(() => {
                if (audioRef.current && !audioRef.current.paused) {
                    onPositionChange(audioRef.current.currentTime);
                }
            }, 1000);
            positionIntervalRef.current = interval;
            return () => {
                if (positionIntervalRef.current !== null) {
                    window.clearInterval(positionIntervalRef.current);
                    positionIntervalRef.current = null;
                }
            };
        }
    }, [onPositionChange, startPlaying, hasStarted]);

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    if (!startPlaying && !hasStarted) return null;

    return (
        <button
            onClick={toggleMute}
            className="fixed top-4 right-4 z-50 w-8 h-8 bg-black/50 border border-gray-600 hover:border-gray-400 flex items-center justify-center text-xs text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Sätt på ljud' : 'Stäng av ljud'}
            aria-label={isMuted ? 'Sätt på ljud' : 'Stäng av ljud'}
        >
            {isMuted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
            )}
        </button>
    );
};

export default BackgroundMusic;
