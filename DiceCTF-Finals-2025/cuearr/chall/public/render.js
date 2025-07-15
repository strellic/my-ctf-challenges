function createQR(text, styles) {
  const style = `
    <style>
      .qr-container {
        background-color: ${styles.background};
        position: relative;
      }
      .white {
        background-color: ${styles.white};
      }
      .black {
        background-color: ${styles.black};
      }
    </style>
  `;
  document.head.insertAdjacentHTML('beforeend', style);

  const qr = new QRCode.QRCodeText(text, {
    level: styles.image ? 'H' : 'L', // use high error correction if an image is provided
  }).toString();
  const lines = qr.split("\n").filter(Boolean);
  
  const container = document.createElement('div');
  container.className = 'qr-container';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${lines[0].length}, 8px)`;
  container.style.gridTemplateRows = `repeat(${lines.length}, 16px)`;
  container.style.border = '2px solid #000';
  container.style.width = 'fit-content';
  container.style.padding = '16px';
  
  for (let col = 0; col < lines[0].length; col++) {
    for (let row = 0; row < lines.length; row++) {
      const cell = document.createElement('div');
      
      if (styles.custom) {
        const [key, value] = styles.custom;
        if (key in cell.style) {
          cell.style[key] = value;
        }
      }

      cell.style.gridRow = `${row + 1}`;
      cell.style.gridColumn = `${col + 1}`;

      if (lines[row][col] === '▓') {
        cell.className = 'black';
      } else {
        cell.className = 'white';
      }

      container.appendChild(cell);
    }
  }

  if (styles.image) {
    const img = document.createElement('img');
    img.src = styles.image;
    img.className = 'qr-center-image';
    
    const qrSize = Math.min(lines[0].length * 8, lines.length * 16);
    const imageSize = Math.floor(qrSize * 0.25);
    img.style.width = `${imageSize}px`;
    img.style.height = `${imageSize}px`;
    img.style.objectFit = 'cover';
    
    container.appendChild(img);
  }

  return container;
}

window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const styles = {
    black: "rgb(0, 0, 0)",
    white: "rgb(255, 255, 255)",
    background: "rgb(255, 255, 255)",
    custom: null,
    image: null
  };

  const getParam = (name) => {
    const param = params.get(name);
    if (param && param.length <= 32) {
      return param;
    }
    return null;
  }

  const black = getParam("black");
  if (black) {
    document.querySelector("input[name='black']").value = black;
    styles.black = black;
  }

  const white = getParam("white");
  if (white) {
    document.querySelector("input[name='white']").value = white;
    styles.white = white;
  }

  const bg = getParam("bg");
  if (bg) {
    document.querySelector("input[name='bg']").value = bg;
    styles.background = bg;
  }

  const image = params.get("image");
  if (image && new URL(image)) {
    document.querySelector("input[name='image']").value = image;
    styles.image = image;
  }

  const custom = getParam("custom");
  if (custom) {
    styles.custom = custom.split(":", 2);
    document.querySelector(`input[name='custom']`).value = custom;
  }

  const qr = (await (await fetch("/api/qr")).json()).qr;
  document.querySelector("#qr").appendChild(createQR(qr, styles));
};