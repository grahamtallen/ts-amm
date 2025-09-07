import { Quote } from "./interfaces.js";

export const findBestSafeQuote = (quotes: Quote[]): Quote | null => {
    if (!quotes.length) return null;
    let best: Quote = quotes[0];
    let highestQuoteWithSlippage: number = getAmountOutWithSlippage(quotes[0]);
    if (quotes.length === 0) return best;
    for (let i = 1; i < quotes.length; i++) {
        const quote = quotes[i];
        const minAmount = getAmountOutWithSlippage(quote);

        if (highestQuoteWithSlippage < minAmount) {
            best = quote;
        } else if (highestQuoteWithSlippage === minAmount) {
            best = quoteWithLowestSlippage(quote, best);
        }
    }
    return best;
}

const getAmountOutWithSlippage = (quote: Quote): number => {
    const { amountOut, slippagePct } = quote;
    return amountOut * (1 - slippagePct / 100)
}

const quoteWithLowestSlippage = (A: Quote, B: Quote): Quote => {
    return A.slippagePct < B.slippagePct ? A : B;
}