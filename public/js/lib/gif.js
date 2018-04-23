import {
    BinaryReader
} from "../lib/binary-reader.js";
import {
    LitteEndianBitReader
} from "../lib/little-endian-bit-reader.js";

export function displayGif(arrayBuffer) {
    const reader = new BinaryReader(arrayBuffer);

    const signature = reader.readAsciiString(3);
    if (signature !== "GIF") {
        throw `signature was incorrect, wanted GIF, saw ${signature}`;
    }

    const version = reader.readAsciiString(3);
    if (version !== "89a") {
        throw `version was incorrect, wanted 89a, saw ${version}`;
    }

    const width = reader.readInt16(true);
    const height = reader.readInt16(true);
    const hasColorTable = reader.readFlag();
    const colorDepth = reader.readUnsignedBits(3);
    const sortFlag = reader.readFlag();
    const colorTableSize = 2 ** (reader.readUnsignedBits(3) + 1);
    const backgroundColorIndex = reader.readUint8();
    const pixelRatio = reader.readUint8();
    const colorTable = hasColorTable ? reader.readSegments(3, colorTableSize) : [];

    let block = reader.readUint8();
    const extensions = [];
    const imageDescriptors = [];
    while (block !== 0x3B) {
        switch (block) {
            case 0x21:
                extensions.push(readExtension(reader));
            case 0x2c:
                imageDescriptors.push(readImageDescriptor(reader, colorTable));
        }
        block = reader.readUint8();
    }

    return draw(colorTable, imageDescriptors[0].indexStream, width, height);
}

function readExtension(reader) {
    const extension = {};
    reader.validateUint8(0xF9);
    const extensionBlockSize = reader.readUint8();
    reader.advanceBits(3);
    extension.disposalMethod = reader.readUnsignedBits(3);
    extension.userInputFlag = reader.readFlag();
    extension.transparentColorFlag = reader.readFlag();

    extension.delayTime = reader.readUint16();
    extension.transparentColorIndex = reader.readUint8();
    reader.validateUint8(0);

    return extension;
}

function readImageDescriptor(reader, colorTable) {
    const imageDescriptor = {};
    imageDescriptor.imageLeft = reader.readUint16();
    imageDescriptor.imageTop = reader.readUint16();
    imageDescriptor.imageWidth = reader.readUint16();
    imageDescriptor.imageHeight = reader.readUint16();
    imageDescriptor.localColorTableFlag = reader.readFlag();
    imageDescriptor.interlaceFlag = reader.readFlag();
    imageDescriptor.localSortFlag = reader.readFlag();
    reader.advanceBits(2);
    imageDescriptor.localColorTableSize = 2 ** (reader.readUnsignedBits(3) + 1);

    //image data
    const lzwMinimumCodeSize = reader.readUint8();
    const subblocks = readSubblocks(reader);
    imageDescriptor.indexStream = lzwDecode(subblocks, colorTable.length, lzwMinimumCodeSize);
    return imageDescriptor;
}

function tablefy(array, width) {
    const table = array.reduce((str, el, i) => {
        if (i % width === 0) {
            return str + "\n" + el
        }
        return str + " " + el;
    });
    console.log(table);
}

function readSubblocks(reader) {
    let length = reader.readUint8();
    if (length === 0) return [];
    const subblocks = reader.readUint8Array(length);
    return subblocks.concat(readSubblocks(reader));
}

function lzwDecode(bytes, colorTableLength, lzwMinimumCodeSize) {
    const reader = new LitteEndianBitReader(byteArrayToArrayBuffer(bytes));
    let table = initTable(colorTableLength, lzwMinimumCodeSize); //first time we could skip the init code...
    let nextTableIndex = colorTableLength + 2;
    let codeSize = lzwMinimumCodeSize + 1;
    let code = reader.readBits(codeSize); //if it wasn't init it wasn't correctly written
    let lastCode = null;

    const result = [];
    while (reader.canReadMore()) {
        code = reader.readBits(codeSize); //bytes are written backwards :(
        if (table[code] === undefined) {
            table[code] = [...table[lastCode], table[lastCode][0]];
            nextTableIndex = code + 1;
            result.push(...table[code]);
        } else if (table[code] === "CC") {
            table = initTable(colorTableLength, lzwMinimumCodeSize);
        } else if (table[code] === "EOI") {
            return result;
        } else {
            result.push(...table[code]);
            if (lastCode !== null) { //shouldn't be 0 so don't worry about it
                table[nextTableIndex] = [...table[lastCode], table[code][0]];
            }
            nextTableIndex++;
        }

        if (nextTableIndex === (2 ** codeSize)) {
            codeSize++;
        }
        lastCode = code;
    }

    return result;
}

function initTable(colorTableLength, lzwMinimumCodeSize) {
    const table = []

    for (let i = 0; i < colorTableLength; i++) {
        table[i] = [i];
    }

    for (let i = colorTableLength; i < lzwMinimumCodeSize; i++) {
        table[i] = null;
    }
    table.push("CC");
    table.push("EOI");
    return table;
}

function byteArrayToArrayBuffer(array) {
    var arrayBuffer = new ArrayBuffer(array.length);
    var uInt8Array = new Uint8Array(arrayBuffer);

    for (var i = 0; i < array.length; i++) {
        uInt8Array[i] = array[i];
    }

    return arrayBuffer;
}

function draw(colorTable, indexStream, width, height) {
    const canvas = document.createElement("canvas");
    canvas.height = height;
    canvas.width = width;
    const context = canvas.getContext("2d");

    const imageData = context.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = colorTable[indexStream[(y * width) + x]]
            if(!color) continue;
            setCanvasPixel(imageData, x, y, color);
        }
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
}

function setCanvasPixel(imageData, x, y, [red, green, blue, alpha]) {
    const offset = ((y * imageData.width) + x) * 4;
    //colors are little endian
    imageData.data[offset + 0] = red;
    imageData.data[offset + 1] = green;
    imageData.data[offset + 2] = blue;
    imageData.data[offset + 3] = alpha || 255;
}