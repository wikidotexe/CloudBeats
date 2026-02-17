import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

interface MarqueeProps {
    text: string;
    className?: string;
    speed?: number; // pixels per second
}

export const Marquee: React.FC<MarqueeProps> = ({ text, className, speed = 35 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const controls = useAnimationControls();

    useEffect(() => {
        let timeoutId: number;

        const calculateMarquee = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const textWidth = textRef.current.offsetWidth;

                if (textWidth > containerWidth && containerWidth > 0) {
                    setShouldAnimate(true);
                    // Reset animation first
                    controls.set({ x: 0 });

                    const distance = textWidth + 80; // 80px gap
                    const duration = distance / speed;

                    controls.start({
                        x: -distance,
                        transition: {
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1.5,
                        },
                    });
                } else {
                    setShouldAnimate(false);
                    controls.stop();
                    controls.set({ x: 0 });
                }
            }
        };

        // Initial calculation
        calculateMarquee();

        // Retry calculation because layouts sometimes take a moment to settle
        timeoutId = window.setTimeout(calculateMarquee, 500);

        const resizeObserver = new ResizeObserver(() => {
            calculateMarquee();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.clearTimeout(timeoutId);
            resizeObserver.disconnect();
            controls.stop();
        };
    }, [text, speed, controls]);

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden whitespace-nowrap relative max-w-full ${className}`}
        >
            <motion.div
                animate={controls}
                className="inline-block"
                style={{ whiteSpace: 'nowrap' }}
            >
                <span ref={textRef} className={shouldAnimate ? "inline-block pr-20" : "inline-block"}>
                    {text}
                </span>
                {shouldAnimate && <span className="inline-block pr-20">{text}</span>}
            </motion.div>

            {shouldAnimate && (
                <>
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent z-10" />
                </>
            )}
        </div>
    );
};
