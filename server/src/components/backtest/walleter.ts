import {
    IPosition
} from "../exchanges";

export class BackTestWallet {
    private amount: number;
    private available: number;

    private winTotal: number;
    private loseTotal: number;

    private maxProfit: number;
    private drawdown: number;
    private drawdownPercent: number;
    private beginAmount: number;

    private hourlyAnalysis;

    constructor(amount: number) {
        this.amount = amount;
        this.beginAmount = amount;
        this.available = amount;

        this.winTotal = 0;
        this.loseTotal = 0;

        this.maxProfit = amount;
        this.drawdown = 0;
        this.drawdownPercent = 0;

        this.hourlyAnalysis = {};
    }

    getAmount(amount: number) {
        if (this.amount > amount && this.available > amount) {
            this.available -= amount;
            return amount;
        }
        return 0;
    }

    setAmount(position: IPosition) {
        this.amount += position.profit;
        this.available += position.profit + position.amount;

        // win/lose analysis
        // hourly analysis
        const hour = position.createdAt.getHours();
        if (!this.hourlyAnalysis[hour]) {
            this.hourlyAnalysis[hour] = 0;
        }
        if (position.profit > 0) {
            this.winTotal += 1;
            this.hourlyAnalysis[hour] += 1;
        } else if (position.profit < 0) {
            this.loseTotal += 1;
            this.hourlyAnalysis[hour] -= 1;
        }

        // calculate drawdown
        if (this.amount > this.maxProfit) {
            this.maxProfit = this.amount;
        }
        if (this.amount < this.maxProfit && this.maxProfit - this.amount > this.drawdown) {
            this.drawdown = this.maxProfit - this.amount;
            this.drawdownPercent = Math.round(this.drawdown / this.maxProfit * 100);
        }
    }

    print() {
        this.amount = Math.round(this.amount * 100) / 100;
        const amountPercent = Math.round((this.amount / this.beginAmount - 1) * 10000) / 100;

        const totalOrder = this.winTotal + this.loseTotal;
        const winPercent = Math.round(this.winTotal / totalOrder * 10000) / 100;
        const losePercent = Math.round(this.loseTotal / totalOrder * 10000) / 100;

        console.log("======================================");
        console.log(`Amount: \t${this.amount} \t ${amountPercent}%`);
        console.log(`Drawdown: \t${this.drawdown} \t ${this.drawdownPercent}%`);
        console.log(`WIN: \t${this.winTotal} \t ${winPercent}%`);
        console.log(`LOSE: \t${this.loseTotal} \t ${losePercent}%`);
        console.log("======================================");
        Object.keys(this.hourlyAnalysis).forEach((hour) => {
            console.log(`At ${hour}: \t ${this.hourlyAnalysis[hour]}`);
        });
        console.log("======================================");
    }
}