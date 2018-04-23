export class LitteEndianBitReader {
    constructor(arrayBuffer){
        this.dataView = new DataView(arrayBuffer);
        this.index = 0;
        this.bitIndex = 7;
    }
    readBits(length){
        const bitBuffer = [];

        for (let i = 0; i < length; i++) {
            bitBuffer.push(this.getBit());
            this.bitIndex--;
            if(this.bitIndex < 0){
                this.bitIndex = 7;
                this.index++;
            }
        }
        return bitBuffer.reduce((agg, b, i) => agg | (b << i), 0);
    }
    getBit(offset = 0){
        const bitOffset = (this.bitIndex + offset) % 8;
        const byteOffset = Math.floor((this.bitIndex + offset) / 8);
        const byte = this.peekByte(byteOffset);
        return (byte >> (7 - bitOffset)) & (1);
    }
    peekByte(offset = 0){
        return this.dataView.getUint8(this.index + offset);
    }
    canReadMore(){
        return this.index < this.dataView.byteLength || this.bitIndex < 7;
    }
}