var GAME_SIZE = {
  width: window.innerHeight,
  height: window.innerWidth
};

const CELL_SIZE = 64;

function GameMaster(){
  this.cells = {},
  this.cellpos
  this.game = null,
  this.context = null,
  this.level = 1,
  this.difficulty = 255,
  this.currentColor = {};
  this.currentHex = "";
  this.currentAnswer = [0,0];
  this.tries = 0;
  this.init = function(){
    this.game = document.getElementById("game");
    this.context = this.game.getContext("2d");

    // Fix for blurry canvas!
    this.game.width = this.game.getBoundingClientRect().width;
    this.game.height = this.game.getBoundingClientRect().height;

    GAME_SIZE = {
      width: this.game.width,
      height: this.game.height
    };

    this.generateCells();

    return this;
  },
  this.generateCells = function(){
    if (this.difficulty == 0) {
      setTimeout((e) => { this.update(); }, 100);
      return this;
    }

    this.tries = 0;
    this.currentColor = this.getRandomColor();
    this.currentHex = this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b);
    var arrCells = [];
    for (let x = 0; x < GAME_SIZE.width; x += CELL_SIZE) {
      this.cells[x] = {};
      for (let y = 0; y < GAME_SIZE.height; y += CELL_SIZE) {
        this.cells[x][y] = {
          color: this.currentHex,
          isAnswer: false
        };

        this.context.fillStyle = this.cells[x][y].color;
        this.context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        arrCells.push([x, y]);
      }
    }

    // Pick a random cell as the answer
    this.currentAnswer = arrCells[Math.floor(Math.random() * arrCells.length)];
    this.context.clearRect(this.currentAnswer[0], this.currentAnswer[1], CELL_SIZE, CELL_SIZE);
    // Get its color
    var hex = this.getCloseColorHex(this.currentHex);
    // Draw the cell
    this.context.fillStyle = hex;
    this.context.fillRect(this.currentAnswer[0], this.currentAnswer[1], CELL_SIZE, CELL_SIZE);
    // Assign the color to the cell
    this.cells[this.currentAnswer[0]][this.currentAnswer[1]].color = hex;
    this.cells[this.currentAnswer[0]][this.currentAnswer[1]].isAnswer = true;
    // Set the onclick listener
    this.game.onclick = (e) => { this.onclick(e); };
    // Display the UI
    this.display();

    return this;
  },
  this.update = function(){
    // Endgame animation.
    for(let x in this.cells) {
      x = parseInt(x);
      for(let y in this.cells[x]){
        y = parseInt(y);
        var c = this.getRandomColor();
        this.cells[x][y].color = this.rgbToHex(c.r, c.g, c.b);
        this.context.fillStyle = this.cells[x][y].color;
        this.context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    // Redraw the UI each time
    this.context.font = "32px Impact"
    this.context.fillStyle = "#000000";
    this.context.fillText("You Win!", GAME_SIZE.width/2.1, 32);

    this.context.font = "16px Impact"
    this.context.fillText("Refresh to restart", GAME_SIZE.width/2.1, 32+16);

    window.requestAnimationFrame((e) => { this.update(); });
  },
  this.getRandomColor = function(){
    // Return a random rgb color
    return {
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255)
    }
  },
  this.rgbToHex = function(red, green, blue) {
    // Transform RBG to hex
    var rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
  },
  this.hexToRgb = function(hex) {
    // Transform Hex to RGB
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  this.getCloseColorHex = function(hex){
    // Get a new color that is close to the one provided.
    var rgb = this.hexToRgb(hex);
    // We start at 255 difficulty, down to 1
    rgb.r = rgb.r + Math.floor(Math.random() * this.difficulty);
    rgb.g = rgb.g + Math.floor(Math.random() * this.difficulty);
    rgb.b = rgb.b + Math.floor(Math.random() * this.difficulty);

    if (rgb.r > 255) {
      rgb.r = 255;
    }
    if (rgb.g > 255) {
      rgb.g = 255;
    }
    if (rgb.b > 255) {
      rgb.b = 255;
    }

    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  },
  this.nextLevel = function(){
    // Augment difficulty
    if (this.difficulty < 10) {
      this.difficulty--;
    } else if (this.difficulty < 25) {
      this.difficulty -= 2;
    } else if (this.difficulty < 50) {
      this.difficulty -= 3;
    } else if (this.difficulty < 100) {
      this.difficulty -= 7;
    } else if (this.difficulty < 150) {
      this.difficulty -= 8;
    } else if (this.difficulty < 200) {
      this.difficulty -= 10;
    } else {
      this.difficulty -= 15;
    }
    // And increment/reset the level and tries
    this.level++;
    this.tries = 0;
    return this;
  },
  this.onclick = function(e){
    // Inrement tries
    this.tries++;
    for(let x in this.cells) {
      x = parseInt(x);
      for(let y in this.cells[x]){
        y = parseInt(y);
        // Did the user click inside a cell?
        if (e.pageY > y &&
            e.pageY < y + CELL_SIZE &&
            e.pageX > x &&
            e.pageX < x + CELL_SIZE) {
          // If the cell was the answer, go to the next level
          if (this.cells[x][y].isAnswer) {
            this.nextLevel();
            this.generateCells();
            break;
          }else{
            // On bad answer, reset the cell and write the number of tries inside it
            this.context.clearRect(x, y, CELL_SIZE, CELL_SIZE);
            this.context.font = CELL_SIZE/2 + "px Impact"
            this.context.fillStyle = "#000000"
            this.context.fillText(this.tries, x + (CELL_SIZE/2.5), y + (CELL_SIZE/1.5));
          }
        }
      }
    }

    // If the user tried too many times, we reset the current level.
    if (this.tries >= 5) {
      this.generateCells();
      return this;
    }

    return this;
  },
  this.display = function(){
    // Render the level display
    this.context.font = "32px Impact"
    this.context.fillStyle = this.invertColor(this.currentHex);
    this.context.fillText("Level " + this.level, GAME_SIZE.width/2.1, 32);

    // Render the difficulty display
    this.context.font = "16px Impact"
    this.context.fillText("Difficulty " + this.difficulty, GAME_SIZE.width/2.1, 32+16);

    return this;
  },
  this.invertColor = function(hex) {
    // Get the inverted color of an Hex
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + this.padZero(r) + this.padZero(g) + this.padZero(b);
  },
  this.padZero = function(str, len) {
      len = len || 2;
      var zeros = new Array(len).join('0');
      return (zeros + str).slice(-len);
  }
  ;
}
// Start the game
var gameMaster = new GameMaster().init();
