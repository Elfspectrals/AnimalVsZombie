const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    scene: [Scene1] // Ensure Scene1 is imported or defined above this script
};

const game = new Phaser.Game(config);

