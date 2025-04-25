import { motion } from 'framer-motion';

const LoadingAnimation = ({ size = 40, color = 'var(--accent-color-primary)' }) => {
  // Container variants
  const containerVariants = {
    initial: {
      rotate: 0,
    },
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        ease: "linear",
        repeat: Infinity,
      }
    }
  };

  // Dot variants for individual dots
  const dotVariants = {
    initial: {
      scale: 1,
      opacity: 0.5,
    },
    animate: {
      scale: [1, 1.5, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      }
    }
  };

  // Calculate positioning for 3 dots
  const getPosition = (index, total = 3, radius = size / 2 - 5) => {
    const angle = (index / total) * 2 * Math.PI;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div 
      className="loading-container" 
      style={{
        width: size,
        height: size,
        position: 'relative',
        margin: '20px auto',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {[0, 1, 2].map((index) => {
          const { x, y } = getPosition(index);
          return (
            <motion.div
              key={index}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              custom={index}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: color,
                left: '50%',
                top: '50%',
                marginLeft: -4 + x,
                marginTop: -4 + y,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
          );
        })}
      </motion.div>
      <style jsx>{`
        .loading-container::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${size / 5}px;
          height: ${size / 5}px;
          background: ${color};
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 15px ${color};
        }
      `}</style>
    </div>
  );
};

export default LoadingAnimation; 