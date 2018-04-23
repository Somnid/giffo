export class BinaryReader {
    constructor(arrayBuffer, index = 0) {
        var binaryReader = {};
        this.arrayBuffer = arrayBuffer;
        this.dataView = new DataView(arrayBuffer);
        this.index = index;
        this.bitOffset = 0;
    } 

    readInt8() {
        var byte = this.dataView.getInt8(this.index);
        this.index++;
        return byte;
    }

    peekInt8(offset) {
        offset = offset || 0;
        var value = this.dataView.getInt8(this.index + offset);
        return value;
    }

    readInt8Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readInt8());
        }
        return array;
    }

    readUint8() {
        var byte;
        if (this.bitOffset === 0) {
            byte = this.dataView.getUint8(this.index);
            this.index++;
        } else {
            byte = this.readUnsignedBits(8);
        }

        return byte;
    }

    peekUint8(offset = 0) {
        var byte;
        if (this.bitOffset === 0) {
            byte = this.dataView.getUint8(this.index + offset);
        } else {
            byte = this.peekUnsignedBits(8, offset * 8);
        }
        return byte;
    }

    peekSnappedUint8(offset = 0) {
        var byte = this.dataView.getUint8(this.index + offset);
        return byte;
    }

    readUint8Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readUint8());
        }
        return array;
    }

    peekUint8Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.peekUint8(i));
        }
        return array;
    }

    readInt16(littleEndian = false) {
        var value = this.dataView.getInt16(this.index, littleEndian);
        this.index += 2;
        return value;
    }

    readInt16Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readInt16());
        }
        return array;
    }

    readUint16() {
        var value = this.dataView.getUint16(this.index);
        this.index += 2;
        return value;
    }

    readUint16Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readUint16());
        }
        return array;
    }

    readInt32() {
        var value = this.dataView.getInt32(this.index);
        this.index += 4;
        return value;
    }

    readInt32Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readInt32());
        }
        return array;
    }

    readUint32() {
        var value = this.dataView.getUint32(this.index);
        this.index += 4;
        return value;
    }

    readUint32Array(count) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(this.readUint32());
        }
        return array;
    }

    readFloat32() {
        var value = this.dataView.getUint32(this.index);
        this.index += 4;
        return value;
    }

    readFloat64() {
        var value = this.dataView.getUint32(this.index);
        this.index += 8;
        return value;
    }

    readAsciiChar() {
        return String.fromCharCode(this.readUint8());
    }

    peekAsciiChar(offset) {
        return String.fromCharCode(this.peekUint8(offset));
    }

    readAsciiString(length) {
        var text = "";
        for (var i = 0; i < length; i++) {
            text += this.readAsciiChar();
        }
        return text;
    }

    peekAsciiString(length) {
        var text = "";
        for (var i = 0; i < length; i++) {
            text += this.peekAsciiChar(i);
        }
        return text;
    }

    readCString() {
        var text = "";
        while (this.peekUint8() !== 0) {
            text += this.readAsciiChar();
        }
        this.readUint8(); //consume 0
        return text;
    }

    readSegments(size, count){
        const segments = [];
        for(let i = 0; i < count; i++){
            segments.push(this.readUint8Array(size));
        }
        return segments;
    }

    skip(bytes) {
        this.index += bytes;
    }

    rewind(bytes) {
        this.index -= bytes;
    }

    getStringRemaining() {
        return this.readAsciiString(this.dataView.byteLength - this.index);
    }

    getSubreader() {
        return create(this.arrayBuffer, this.index);
    }

    canReadMore() {
        return this.index < this.dataView.byteLength;
    }

    readBit() {
        var byte = this.peekSnappedUint8();
        var bit = (byte >> (7 - this.bitOffset)) & (1);
        this.advanceBit();
        return bit;
    }

    readFlag() {
        return this.readBit() === 1;
    }

    peekBit(offset = 0) {
        var bitOffset = (this.bitOffset + offset) % 8;
        var byteOffset = Math.floor((this.bitOffset + offset) / 8);
        var byte = this.peekSnappedUint8(byteOffset);
        var bit = (byte >> (7 - bitOffset)) & (1);
        return bit;
    }

    peekFlag(offset) {
        return this.peekBit(offset) === 1;
    }

    advanceBit() {
        if (this.bitOffset == 7) {
            this.bitOffset = 0;
            this.index++;
        } else {
            this.bitOffset++;
        }
    }

    advanceBits(count){
        for(let i = 0; i < count; i++){
            this.advanceBit();
        }
    }

    readUnsignedBits(length) {
        let value = 0;

        for (let i = 0; i < length; i++) {
            value = (value << 1) | this.readBit();
        }
        return value;
    }

    peekUnsignedBits(length, offset = 0) {
        let value = 0;

        for (let i = 0; i < length; i++) {
            value = (value << 1) | this.peekBit(offset + i);
        }
        return value;
    }

    peekBitArray(length, offset = 0){
        const bits = [];
        for(let i = 0; i < length; i++){
            bits.push(this.peekBit(offset + i));
        }
        return bits;
    }

    validateUint8(expectation){
        const value = this.readUint8();
        if(value !== expectation){
            throw `Expected value ${expectation}, got ${value} at byte index ${this.index}`;
        }
    }

    printRemainingHex(){
        return this.peekUint8Array(this.dataView.byteLength - this.index).map(b => b.toString(16));
    }
}
