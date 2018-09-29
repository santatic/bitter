//@version=3
study("Moving Average Cross and/or Bbands bot", shorttitle="Alerts", overlay=false)

//Make the backtest numbers more legible depending on the market you're trading, altcoin, forex, or commodities.
qty = 1

// If you're trading an altcoin, make this true and the backtest numbers are now equivalent to 1 satoshi
isALT = input(false, "Altcoin")

if isALT
    qty:= 100000000

// If you're trading forex, make this true and the backtest numbers are now equivalent to $0.0001
isForex = input(false, "Forex")
if isForex
    qty:= 10000

//* Backtesting Period Selector | Component *//
//* https://www.tradingview.com/script/eCC1cvxQ-Backtesting-Period-Selector-Component *//
//* https://www.tradingview.com/u/pbergden/ *//
//* Modifications made *//
testStartYear = input(2017, "Backtest Start Year") 
testStartMonth = input(8, "Backtest Start Month")
testStartDay = input(25, "Backtest Start Day")
testPeriodStart = timestamp(testStartYear,testStartMonth,testStartDay,0,0)

testStopYear = input(99999, "Backtest Stop Year")
testStopMonth = input(9, "Backtest Stop Month")
testStopDay = input(26, "Backtest Stop Day")
testPeriodStop = timestamp(testStopYear,testStopMonth,testStopDay,0,0)

testPeriod() =>
    time >= testPeriodStart and time <= testPeriodStop ? true : false
/////////////// END - Backtesting Period Selector | Component ///////////////

//* Heiken Ashi Candles *//
isHA = input(false, "HA Candles")

data = isHA ? heikenashi(tickerid) : tickerid

o = security(data, period, open)
h = security(data, period, high)
l = security(data, period, low)
c = security(data, period, close)

g = c > o
r = c < o

col = c > o ? green : red

// plotcandle(o, h, l, c, "Heiken Ashi", col, black)

//Initial open logic, needs to be set at the beginning as this is affected by most of the following settings
long = na
short = na 

//* Moving Average Logic *\\
// Enable this to only long or short if you are above or below the Moving Average
useMA = input(false, "Use Moving Average Cross")
ma1Input = input(50, "Moving Average 1")
ma2Input = input(200, "Moving Average 2")

ma1 = sma(c, ma1Input)
ma2 = sma(c, ma2Input)

maLong = c > ma1 and ma1 > ma2
maShort = c < ma1 and ma1 < ma2

ma1Plot = na
ma2Plot = na

if useMA
    ma1Plot := ma1
    ma2Plot := ma2
    long := maLong
    short := maShort

// plot(ma1Plot, "ma1", blue)
// plot(ma2Plot, "ma2", orange)

//* Bollinger Bands Logic *\\
// Enable this to only long or short if you are above or below the Bollinger Bands

useBbands = input(false, "Use Bollinger Bands")

bblength = input(20, minval=1)
mult = input(2.0, minval=0.001, maxval=50)
basis = sma(c, bblength)
dev = mult * stdev(c, bblength)
upper = basis + dev
lower = basis - dev

basisPlot = na
p1Plot = na
p2Plot = na

if useBbands
    long := c < lower
    short := c > upper
    basisPlot := basis
    p1Plot := upper
    p2Plot := lower

if useBbands and useMA
    long := c < lower and maLong
    short := c > upper and maShort

plot(basisPlot, color=red)
p1 = plot(p1Plot, color=blue)
p2 = plot(p2Plot, color=blue)
fill(p1, p2)

//////////////////////////
//* Strategy Component *//
//////////////////////////

// Count your long short conditions for more control with Pyramiding
sectionLongs = 0
sectionLongs := nz(sectionLongs[1])
sectionShorts = 0
sectionShorts := nz(sectionShorts[1])

if long
    sectionLongs := sectionLongs + 1
    sectionShorts := 0

if short
    sectionLongs := 0
    sectionShorts := sectionShorts + 1
    
// Pyramiding Inputs

pyrl = input(1, "Pyramiding less than") // If your count is less than this number
pyre = input(0, "Pyramiding equal to") // If your count is equal to this number
pyrg = input(1000000, "Pyramiding greater than") // If your count is greater than this number

// These check to see your signal and cross references it against the pyramiding settings above
longCondition = long and sectionLongs <= pyrl or long and sectionLongs >= pyrg or long and sectionLongs == pyre ? 1 : 0
shortCondition = short and sectionShorts <= pyrl or short and sectionShorts >= pyrg or short and sectionShorts == pyre ? 1 : 0

// Get the price of the last opened long or short
last_open_longCondition = na
last_open_shortCondition = na
last_open_longCondition := longCondition ? close : nz(last_open_longCondition[1])
last_open_shortCondition := shortCondition ? close : nz(last_open_shortCondition[1])

// Count your actual opened positions for things like getting your average order price
sectionLongConditions = 0
sectionLongConditions := nz(sectionLongConditions[1])
sectionShortConditions = 0
sectionShortConditions := nz(sectionShortConditions[1])

if longCondition
    sectionLongConditions := sectionLongConditions + 1
    sectionShortConditions := 0

if shortCondition
    sectionLongConditions := 0
    sectionShortConditions := sectionShortConditions + 1

// Check if your last postion was a long or a short
last_longCondition = na
last_shortCondition = na
last_longCondition := longCondition ? time : nz(last_longCondition[1])
last_shortCondition := shortCondition ? time : nz(last_shortCondition[1])

in_longCondition = last_longCondition > last_shortCondition
in_shortCondition = last_shortCondition > last_longCondition

// Keep track of the highest high since you last opened a position
last_high = na
last_low = na
last_high_short = na
last_low_short = na
last_high := not in_longCondition ? na : in_longCondition and (na(last_high[1]) or high > nz(last_high[1])) ? high : nz(last_high[1])
last_high_short := not in_shortCondition ? na : in_shortCondition and (na(last_high[1]) or high > nz(last_high[1])) ? high : nz(last_high[1])
last_low := not in_shortCondition ? na : in_shortCondition and (na(last_low[1]) or low < nz(last_low[1])) ? low : nz(last_low[1])
last_low_short := not in_longCondition ? na : in_longCondition and (na(last_low[1]) or low < nz(last_low[1])) ? low : nz(last_low[1])

// Trailing Stop
isTS = input(false, "Trailing Stop")
tsi = input(0, "Activate Trailing Stop Price") / qty
ts = input(0, "Trailing Stop") / qty
long_ts = isTS and not na(last_high) and crossunder(low, last_high - ts) and longCondition == 0 and high >= (last_open_longCondition + tsi) ? 1 : 0
short_ts = isTS and not na(last_low) and crossover(high, last_low + ts) and shortCondition == 0 and low <= (last_open_shortCondition - tsi) ? 1 : 0
tsColor = isTS and in_longCondition and last_high >= (last_open_longCondition + tsi) ? blue : isTS and in_shortCondition and last_low <= (last_open_shortCondition - tsi) ? blue : white
tsiColor = isTS and in_longCondition and last_high >= (last_open_longCondition + tsi) ? white : isTS and in_shortCondition and last_low <= (last_open_shortCondition - tsi) ? white : blue
// plot(isTS and in_longCondition ? last_open_longCondition + tsi : na, "Long Trailing", tsiColor, style=3, linewidth=2)
// plot(isTS and in_shortCondition ? last_open_shortCondition - tsi : na, "Short Trailing", tsiColor, style=3, linewidth=2)
// plot(isTS and in_longCondition and last_high >= (last_open_longCondition + tsi) ? last_high - ts : na, "Long Trailing", tsColor, style=2, linewidth=2)
// plot(isTS and in_shortCondition and last_low <= (last_open_shortCondition - tsi) ? last_low + ts : na, "Short Trailing", tsColor, style=2, linewidth=2)

// Take profit
isTP = input(false, "Take Profit")
tp = input(0, "Take Profit") / qty
long_tp = isTP and crossover(high, last_open_longCondition + tp) and longCondition == 0 ? 1 : 0
short_tp = isTP and crossunder(low, last_open_shortCondition - tp) and shortCondition == 0 ? 1 : 0
tpColor = isTP and in_longCondition ? purple : isTP and in_shortCondition ? purple : white
// plot(isTP and in_longCondition and last_high < last_open_longCondition + tp ? last_open_longCondition + tp : na, "Long TP", tpColor, style=3, linewidth=2)
// plot(isTP and in_shortCondition and last_low > last_open_shortCondition - tp ? last_open_shortCondition - tp : na, "Short TP", tpColor, style=3, linewidth=2)

// Stop Loss
isSL = input(false, "Stop Loss")
sl = input(10, "Stop Loss") / qty
long_sl = isSL and crossunder(low, last_open_longCondition - sl) and longCondition == 0 ? 1 : 0
short_sl = isSL and crossover(high, last_open_shortCondition + sl) and shortCondition == 0 ? 1 : 0
slColor = isSL and in_longCondition and last_low_short > last_open_longCondition - sl ? red : isSL and in_shortCondition and last_high_short < last_open_shortCondition + sl ? red : white
// plot(isSL and in_longCondition ? last_open_longCondition - sl : na, "Long SL", slColor, style=3, linewidth=2)
// plot(isSL and in_shortCondition ? last_open_shortCondition + sl : na, "Short SL", slColor, style=3, linewidth=2)

// Margin Call. Depending on your leverage, this will mimick a margin call at -80%.
isMargin = input(false, "Margin Call")
leverage = input(1, "Leverage")
long_call = last_open_longCondition - (0.8 + 0.2 * (1/leverage)) / leverage * last_open_longCondition
short_call = last_open_shortCondition + (0.78 + 0.2 * (1/leverage)) / leverage * last_open_shortCondition
long_call_signal = isMargin and crossunder(low, long_call) ? 1 : 0
short_call_signal = isMargin and crossover(high, short_call) ? 1 : 0
marginColor = isMargin and in_longCondition and last_low_short > long_call ? black : isMargin and in_shortCondition and last_high_short < short_call ? black : white
// plot(isMargin and in_longCondition ? long_call : na, "Long Margin", marginColor, style=3, linewidth=2)
// plot(isMargin and in_shortCondition ? short_call : na, "Short Margin", marginColor, style=3, linewidth=2)

// Get the average price of your open positions and plot them
totalLongs = 0.0
totalLongs := nz(totalLongs[1])
totalShorts = 0.0
totalShorts := nz(totalShorts[1])
averageLongs = 0.0
averageLongs := nz(averageLongs[1])
averageShorts = 0.0
averageShorts := nz(averageShorts[1]) 

if longCondition
    totalLongs := totalLongs + last_open_longCondition
    totalShorts := 0.0

if shortCondition
    totalLongs := 0.0
    totalShorts := totalShorts + last_open_shortCondition

averageLongs := totalLongs / sectionLongConditions
averageShorts := totalShorts / sectionShortConditions

longProfit = averageLongs > 0 and close >= averageLongs ? green : red
shortProfit = averageShorts > 0 and close <= averageShorts ? green : red

// plot1 = plot(averageLongs > 0 ? averageLongs : na, color=white)
// plot2 = plot(close, color=white)
// plot3 = plot(averageShorts > 0 ? averageShorts : na, color=white)

// fill(plot1, plot2, color=longProfit, transp=50)
// fill(plot2, plot3, color=shortProfit, transp=50)

//Enable this to double your order size every time your pyramid on top of an existing position. (Martingale strategy)
useMartin = input(true, "Martingale")

longMartin = 0
longMartin := nz(longMartin[1])
shortMartin = 0
shortMartin := nz(shortMartin[1])

// Check to see if this is our first order, set the order qty to 1
if longCondition and sectionLongConditions == 1
    longMartin := longMartin + 1
    shortMartin := 0
if shortCondition and sectionShortConditions == 1
    longMartin := 0
    shortMartin := shortMartin + 1

// confirm that this order is being added to an existing order
if longCondition and sectionLongConditions > 1
    longMartin := longMartin * 2
if shortCondition and sectionShortConditions > 1
    shortMartin := shortMartin * 2

// Close Conditions amalgamation for cleaner plots and signals
// Define the plot colors for each close condition
longCloseCol = na
shortCloseCol = na
longCloseCol := long_tp ? purple : long_sl ? maroon : long_ts ? blue : long_call_signal ? black : longCloseCol[1]
shortCloseCol := short_tp ? purple : short_sl ? maroon : short_ts ? blue : short_call_signal ? black : shortCloseCol[1]

// Create a single close for all the different closing conditions.
long_close = long_tp or long_sl or long_ts or long_call_signal ? 1 : 0
short_close = short_tp or short_sl or short_ts or short_call_signal ? 1 : 0

// Get the time of the last close
last_long_close = na
last_short_close = na
last_long_close := long_close ? time : nz(last_long_close[1])
last_short_close := short_close ? time : nz(last_short_close[1])

// Check for a close since your last open.
if long_close and last_long_close[1] > last_longCondition
    long_close := 0
if short_close and last_short_close[1] > last_shortCondition
    short_close := 0

// Plot your opens and close
plot(longCondition, "Long Open", green)
plot(shortCondition, "Short Open", red)

plot(long_close, "Long Close", longCloseCol)
plot(short_close, "Short Close", shortCloseCol)

// Autoview alert syntax - This assumes you're trading cross margin, otherwise you need to adjust your l= to a specific leverage.
// Only use Autoview to automate a strategy after you've sufficiently backtested and forward tested your strategy.
//
// These settings are set, by default, to the lowest contracts allowed by Bitmex (at the time of this posting) to avoid a spam account.
// You can learn more about the syntax here: http://autoview.with.pink/#syntax and you can watch this video here: https://www.youtube.com/watch?v=epN5Tjinuxw

// For the opens, you will want to trigger these alerts on close.
alertcondition(longCondition, "Open Long", "b=long l=0 q=25 t=market")
alertcondition(shortCondition, "Open Short", "b=short l=0 q=25 t=market")

// For the closes you will want to trigger these alerts on condition.
//This gets it as it happens and typically results in a better exit live than in the backtest. It works really well for counteracting slippage from the market orders.
alertcondition(long_close, "Close Longs", "b=long c=position t=market")
alertcondition(short_close, "Close Shorts", "b=short c=position t=market")