import { Quote } from "./interfaces.js";

export const findBestSafeQuote = (quotes: Quote[], EPS: number = 1e-12): Quote | null => {
    if (!quotes.length) return null;
    let best: Quote | null = null;
    let highestQuoteWithSlippage: number = 0;
    for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        const { slippagePct, amountOut } = quote;
        if (slippagePct < 0 || amountOut <= 0) continue;
        const minAmount = getAmountOutWithSlippage(quote);

        if (Math.abs(highestQuoteWithSlippage - minAmount) < EPS) {
            // tied
            best = quoteWithLowestSlippage(quote, best);
            highestQuoteWithSlippage = getAmountOutWithSlippage(best);
        } else if (!best || highestQuoteWithSlippage < minAmount) {
            best = quote;
            highestQuoteWithSlippage = minAmount;
        }
    }
    return best;
}

const getAmountOutWithSlippage = (quote: Quote): number => {
    const { amountOut, slippagePct } = quote;
    if (slippagePct === 0) {
        return amountOut;
    }
    return amountOut * (1 - slippagePct / 100)
}

const quoteWithLowestSlippage = (A: Quote, B: Quote | null): Quote => {
    if (!B) {
        return A;
    }
    return A.slippagePct < B.slippagePct ? A : B;
}