function createCelebration(container, animationType, calm) {
  const animationSettings = getAnimationSettings(animationType);

  // Ruhiger Modus: wenige, langsam fallende Teile
  const amount = calm ? 8 : animationSettings.amount;

  for (let i = 0; i < amount; i++) {
    const piece = document.createElement("div");
    piece.classList.add("celebration-piece");

    piece.textContent = animationSettings.symbols
      ? getRandomItem(animationSettings.symbols)
      : "";

    piece.style.left = Math.random() * 100 + "%";

    piece.style.backgroundColor = animationSettings.useBackground
      ? getRandomItem(animationSettings.colors)
      : "transparent";

    piece.style.color = getRandomItem(animationSettings.colors);
    piece.style.width = animationSettings.width();
    piece.style.height = animationSettings.height();
    piece.style.fontSize = animationSettings.fontSize();
    piece.style.borderRadius = animationSettings.borderRadius();
    piece.style.animationName = calm ? "fall-straight" : getRandomItem(animationSettings.keyframes);
    piece.style.animationDuration = calm ? "3.5s" : animationSettings.duration();
    piece.style.animationDelay = Math.random() * 0.35 + "s";

    container.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 4200);
  }
}

function getAnimationSettings(type) {
  const baseColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#a855f7",
    "#ec4899"
  ];

  const settings = {
    confetti: {
      amount: 90,
      useBackground: true,
      colors: baseColors,
      symbols: null,
      keyframes: ["fall-straight", "fall-wiggle", "fall-spin"],
      width: () => "10px",
      height: () => "16px",
      fontSize: () => "1rem",
      borderRadius: () => "2px",
      duration: () => 1.8 + Math.random() * 1.4 + "s"
    },

    stars: {
      amount: 55,
      useBackground: false,
      colors: ["#facc15", "#fde047", "#f59e0b"],
      symbols: ["⭐", "🌟", "✨"],
      keyframes: ["fall-spin", "fall-wiggle"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.6 + Math.random() * 1.4 + "rem",
      borderRadius: () => "0",
      duration: () => 2 + Math.random() * 1.4 + "s"
    },

    hearts: {
      amount: 55,
      useBackground: false,
      colors: ["#ef4444", "#ec4899", "#fb7185"],
      symbols: ["❤️", "💖", "💕"],
      keyframes: ["fall-swing", "fall-bounce"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.5 + Math.random() * 1.3 + "rem",
      borderRadius: () => "0",
      duration: () => 2 + Math.random() * 1.5 + "s"
    },

    circles: {
      amount: 75,
      useBackground: true,
      colors: ["#38bdf8", "#22c55e", "#a78bfa", "#f472b6"],
      symbols: null,
      keyframes: ["fall-bounce", "fall-straight"],
      width: () => 10 + Math.random() * 18 + "px",
      height: () => 10 + Math.random() * 18 + "px",
      fontSize: () => "1rem",
      borderRadius: () => "999px",
      duration: () => 1.8 + Math.random() * 1.5 + "s"
    },

    ribbons: {
      amount: 80,
      useBackground: true,
      colors: baseColors,
      symbols: null,
      keyframes: ["fall-swing", "fall-wiggle"],
      width: () => "8px",
      height: () => 24 + Math.random() * 24 + "px",
      fontSize: () => "1rem",
      borderRadius: () => "999px",
      duration: () => 2 + Math.random() * 1.5 + "s"
    },

    diamonds: {
      amount: 65,
      useBackground: false,
      colors: ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"],
      symbols: ["◆", "◇", "♦"],
      keyframes: ["fall-spin", "fall-straight"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.5 + Math.random() * 1.4 + "rem",
      borderRadius: () => "0",
      duration: () => 2 + Math.random() * 1.4 + "s"
    },

    smileys: {
      amount: 45,
      useBackground: false,
      colors: ["#facc15", "#fb923c", "#22c55e"],
      symbols: ["😊", "😄", "🥳", "😃"],
      keyframes: ["fall-bounce", "fall-spin"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.5 + Math.random() * 1.5 + "rem",
      borderRadius: () => "0",
      duration: () => 2 + Math.random() * 1.5 + "s"
    },

    flowers: {
      amount: 50,
      useBackground: false,
      colors: ["#ec4899", "#f97316", "#a855f7", "#22c55e"],
      symbols: ["🌸", "🌼", "🌺", "🌻"],
      keyframes: ["fall-swing", "fall-wiggle"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.5 + Math.random() * 1.4 + "rem",
      borderRadius: () => "0",
      duration: () => 2.1 + Math.random() * 1.5 + "s"
    },

    sparkles: {
      amount: 70,
      useBackground: false,
      colors: ["#fde047", "#facc15", "#ffffff", "#a78bfa"],
      symbols: ["✨", "✦", "✧", "★"],
      keyframes: ["fall-spin", "fall-wiggle"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.3 + Math.random() * 1.4 + "rem",
      borderRadius: () => "0",
      duration: () => 1.8 + Math.random() * 1.4 + "s"
    },

    balloons: {
      amount: 45,
      useBackground: false,
      colors: ["#ef4444", "#3b82f6", "#22c55e", "#f97316"],
      symbols: ["🎈", "🎉", "🎊"],
      keyframes: ["fall-swing", "fall-bounce"],
      width: () => "auto",
      height: () => "auto",
      fontSize: () => 1.6 + Math.random() * 1.4 + "rem",
      borderRadius: () => "0",
      duration: () => 2.2 + Math.random() * 1.5 + "s"
    }
  };

  return settings[type] || settings.confetti;
}
