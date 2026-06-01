/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  likeCount: number;
  postId: string;
  isLiked?: boolean;
  onToggleLike: () => Promise<void>;
}

// Floating heart particle component
function FloatingHeart() {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      animate={{ opacity: 0, y: -40, x: (Math.random() - 0.5) * 40, scale: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute pointer-events-none"
    >
      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
    </motion.div>
  );
}

export function LikeButton({
  likeCount,
  isLiked: initialIsLiked = false,
  onToggleLike,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<string[]>([]);

  // Calculate displayed count from actual likeCount plus any optimistic delta
  const displayCount = (likeCount ?? 0) + optimisticDelta;

  const handleClick = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Optimistic update
    const newIsLiked = !isLiked;
    const delta = newIsLiked ? 1 : -1;
    setIsLiked(newIsLiked);
    setOptimisticDelta(prevDelta => prevDelta + delta);

    // Show floating hearts on like
    if (newIsLiked) {
      const heartId = `${Date.now()}-${Math.random()}`;
      setFloatingHearts((prev) => [...prev, heartId]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((id) => id !== heartId));
      }, 800);
    }

    try {
      await onToggleLike();
      // Success - clear optimistic delta, server has updated the count
      setOptimisticDelta(0);
    } catch (err) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setOptimisticDelta(0);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-xs relative"
        onClick={handleClick}
        disabled={isAnimating}
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isLiked
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          />
        </motion.div>
        <motion.span
          key={displayCount}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {displayCount}
        </motion.span>
      </Button>

      {/* Floating hearts container */}
      {floatingHearts.map((heartId) => (
        <div key={heartId} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <FloatingHeart />
        </div>
      ))}
    </div>
  );
}
