import BN from "bn.js";

export const AMOUNT_DEC = 18;
export const PRICE_DEC = 36;

export const SCALE_54 = new BN(10).pow(new BN(54));
export const SCALE_18 = new BN(10).pow(new BN(18));
export const SCALE_36 = new BN(10).pow(new BN(36)); // 54 - 18
