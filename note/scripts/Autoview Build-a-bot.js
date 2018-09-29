//@version=3
// Learn more about Autoview and how you can automate strategies like this one here: https://autoview.with.pink/
strategy("Autoview Build-a-bot", "Strategy", overlay=true, pyramiding=2000, default_qty_value=10000)
// study("Autoview Build-a-bot", "Alerts")

///////////////////////////////////////////////
//* Backtesting Period Selector | Component *//
///////////////////////////////////////////////

//* https://www.tradingview.com/script/eCC1cvxQ-Backtesting-Period-Selector-Component *//
//* https://www.tradingview.com/u/pbergden/ *//
//* Modifications made *//

testStartYear = input(1, "Backtest Start Year") 
testStartMonth = input(11, "Backtest Start Month")
testStartDay = input(10, "Backtest Start Day")
testPeriodStart = timestamp(testStartYear,testStartMonth,testStartDay,0,0)

testStopYear = input(77777777, "Backtest Stop Year")
testStopMonth = input(11, "Backtest Stop Month")
testStopDay = input(15, "Backtest Stop Day")
testPeriodStop = timestamp(testStopYear,testStopMonth,testStopDay,0,0)

testPeriod() =>
    time >= testPeriodStart and time <= testPeriodStop ? true : false

/////////////////////////////////////
//* Put your strategy logic below *//
/////////////////////////////////////

src = close
len = input(4, minval=1, title="Length")

up = rma(max(change(src), 0), len)
down = rma(-min(change(src), 0), len)
rsi = down == 0 ? 100 : up == 0 ? 0 : 100 - (100 / (1 + up / down))

rsin = input(5)
sn = 100 - rsin
ln = 0 + rsin

// Put your long and short rules here
longLocic = crossunder(rsi, ln)
shortLogic = crossover(rsi, sn)

//////////////////////////
//* Strategy Component *//
//////////////////////////

isLong = input(false, "Longs Only")
isShort = input(false, "Shorts Only")
isFlip = input(false, "Flip the Opens")

long = longLocic
short = shortLogic

if isFlip
    long := shortLogic
    short := longLocic
else
    long := longLocic
    short := shortLogic

if isLong
    long := long
    short := na

if isShort
    long := na
    short := short
    
////////////////////////////////
//======[ Signal Count ]======//
////////////////////////////////

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

//////////////////////////////
//======[ Pyramiding ]======//
//////////////////////////////

pyrl = input(1, "Pyramiding less than") // If your count is less than this number
pyre = input(0, "Pyramiding equal to") // If your count is equal to this number
pyrg = input(1000000, "Pyramiding greater than") // If your count is greater than this number

longCondition = long and sectionLongs <= pyrl or long and sectionLongs >= pyrg or long and sectionLongs == pyre ? 1 : 0
shortCondition = short and sectionShorts <= pyrl or short and sectionShorts >= pyrg or short and sectionShorts == pyre ? 1 : 0

////////////////////////////////
//======[ Entry Prices ]======//
////////////////////////////////

last_open_longCondition = na
last_open_shortCondition = na
last_open_longCondition := longCondition ? close : nz(last_open_longCondition[1])
last_open_shortCondition := shortCondition ? close : nz(last_open_shortCondition[1])

////////////////////////////////////
//======[ Open Order Count ]======//
////////////////////////////////////

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
    
///////////////////////////////////////////////
//======[ Position Check (long/short) ]======//
///////////////////////////////////////////////

last_longCondition = na
last_shortCondition = na
last_longCondition := longCondition ? time : nz(last_longCondition[1])
last_shortCondition := shortCondition ? time : nz(last_shortCondition[1])

in_longCondition = last_longCondition > last_shortCondition
in_shortCondition = last_shortCondition > last_longCondition

/////////////////////////////////////
//======[ Position Averages ]======//
/////////////////////////////////////

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

/////////////////////////////////
//======[ Trailing Stop ]======//
/////////////////////////////////

isTS = input(false, "Trailing Stop")
tsi = input(100, "Activate Trailing Stop Price (%). Divided by 100 (1 = 0.01%)") / 100 
ts = input(100, "Trailing Stop (%). Divided by 100 (1 = 0.01%)") / 100

last_high = na
last_low = na
last_high_short = na
last_low_short = na
last_high := not in_longCondition ? na : in_longCondition and (na(last_high[1]) or high > nz(last_high[1])) ? high : nz(last_high[1])
last_high_short := not in_shortCondition ? na : in_shortCondition and (na(last_high[1]) or high > nz(last_high[1])) ? high : nz(last_high[1])
last_low := not in_shortCondition ? na : in_shortCondition and (na(last_low[1]) or low < nz(last_low[1])) ? low : nz(last_low[1])
last_low_short := not in_longCondition ? na : in_longCondition and (na(last_low[1]) or low < nz(last_low[1])) ? low : nz(last_low[1])

long_ts = isTS and not na(last_high) and low <= last_high - last_high / 100 * ts and longCondition == 0 and last_high >= averageLongs + averageLongs / 100 * tsi
short_ts = isTS and not na(last_low) and high >= last_low + last_low / 100 * ts and shortCondition == 0 and last_low <= averageShorts - averageShorts/ 100 * tsi

///////////////////////////////
//======[ Take Profit ]======//
///////////////////////////////

isTP = input(false, "Take Profit")
tp = input(100, "Take Profit (%). Divided by 100 (1 = 0.01%)") / 100
long_tp = isTP and close > averageLongs + averageLongs / 100 * tp and not longCondition
short_tp = isTP and close < averageShorts - averageShorts / 100 * tp and not shortCondition

/////////////////////////////
//======[ Stop Loss ]======//
/////////////////////////////

isSL = input(false, "Stop Loss")
sl = input(100, "Stop Loss (%). Divided by 100 (1 = 0.01%)") / 100
long_sl = isSL and close < averageLongs - averageLongs / 100 * sl and longCondition == 0
short_sl = isSL and close > averageShorts + averageShorts / 100 * sl and shortCondition == 0

/////////////////////////////////
//======[ Close Signals ]======//
/////////////////////////////////

longClose = long_tp or long_sl or long_ts ? 1 : 0
shortClose = short_tp or short_sl or short_ts ? 1: 0

///////////////////////////////
//======[ Plot Colors ]======//
///////////////////////////////

longCloseCol = na
shortCloseCol = na
longCloseCol := long_tp ? purple : long_sl ? maroon : long_ts ? blue : longCloseCol[1]
shortCloseCol := short_tp ? purple : short_sl ? maroon : short_ts ? blue : shortCloseCol[1]
tpColor = isTP and in_longCondition ? purple : isTP and in_shortCondition ? purple : white
slColor = isSL and in_longCondition ? red : isSL and in_shortCondition ? red : white

//////////////////////////////////
//======[ Strategy Plots ]======//
//////////////////////////////////

plot(isTS and in_longCondition ? averageLongs + averageLongs / 100 * tsi : na, "Long Trailing Activate", blue, style=3, linewidth=2)
plot(isTS and in_longCondition and last_high >= averageLongs +  averageLongs / 100 * tsi ? last_high - last_high / 100 * ts : na, "Long Trailing", fuchsia, style=2, linewidth=3)
plot(isTS and in_shortCondition ? averageShorts - averageShorts/ 100 * tsi : na, "Short Trailing Activate", blue, style=3, linewidth=2)
plot(isTS and in_shortCondition and last_low <= averageShorts - averageShorts/ 100 * tsi ? last_low + last_low / 100 * ts : na, "Short Trailing", fuchsia, style=2, linewidth=3)
plot(isTP and in_longCondition and last_high < averageLongs + averageLongs / 100 * tp ? averageLongs + averageLongs / 100 * tp : na, "Long TP", tpColor, style=3, linewidth=2)
plot(isTP and in_shortCondition and last_low > averageShorts - averageShorts / 100 * tp ? averageShorts - averageShorts / 100 * tp : na, "Short TP", tpColor, style=3, linewidth=2)
plot(isSL and in_longCondition and last_low_short > averageLongs - averageLongs / 100 * sl ? averageLongs - averageLongs / 100 * sl : na, "Long SL", slColor, style=3, linewidth=2)
plot(isSL and in_shortCondition and last_high_short < averageShorts + averageShorts / 100 * sl ? averageShorts + averageShorts / 100 * sl : na, "Short SL", slColor, style=3, linewidth=2)

///////////////////////////////
//======[ Alert Plots ]======//
///////////////////////////////

// plot(longCondition, "Long", green)
// plot(shortCondition, "Short", red)
// plot(longClose, "Long Close", longCloseCol)
// plot(shortClose, "Short Close", shortCloseCol)

///////////////////////////////////
//======[ Reset Variables ]======//
///////////////////////////////////

if longClose or not in_longCondition
    averageLongs := 0
    totalLongs := 0.0
    sectionLongs := 0
    sectionLongConditions := 0

if shortClose or not in_shortCondition
    averageShorts := 0
    totalShorts := 0.0
    sectionShorts := 0
    sectionShortConditions := 0

////////////////////////////////////////////
//======[ Strategy Entry and Exits ]======//
////////////////////////////////////////////

if testPeriod()
    strategy.entry("Long", 1, when=longCondition)
    strategy.entry("Short", 0,  when=shortCondition)
    strategy.close("Long", when=longClose)
    strategy.close("Short", when=shortClose)