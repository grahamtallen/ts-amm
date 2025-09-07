import { Quote } from "./interfaces.js";

export const findBestSafeQuote = (quotes: Quote[]): Quote => {
    let best: Quote = quotes[0];
    let highestQuoteWithSlippage: number = getAmountOutWithSlippage(quotes[0]);
    for (let i = 1; i < quotes.length; i++) {
        const quote = quotes[i];
        const minAmount = getAmountOutWithSlippage(quote);

        if (highestQuoteWithSlippage < minAmount) {
            best = quote;
        }
    }
    return best;
}

const getAmountOutWithSlippage = (quote: Quote): number => {
    const { amountOut, slippagePct } = quote;
    console.log({
        ...quote,
        minAmount: amountOut * (1 - slippagePct / 100)
    })
    return amountOut * (1 - slippagePct / 100)
}