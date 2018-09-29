//@version=2
strategy("MTF MACD 2", title = "MultiMACD2", overlay=true)

longTermTimeFrame = input(1440, minval=1, title = "Long Term Time Frame")
longTermDelayPeriod = input(0, minval = 0, title = "Long Term Delay Period")
midTermTimeFrame = input(240, minval=1, title = "Mid Term Time Frame")
midTermDelayPeriod = input(1, minval = 0, title = "Mid Term Delay Period")
tradeOnLongTermTrendDirection = input(true, type = bool, title = "Trade On LongTerm Trend Direction")

//shortTermTimeFrame = input(60, minval=1, title="Short Term Time Frame")
tpPercent = input(5, type=float, title = "Take Profit Percent")
slPercent = input(10, type=float, title = "Stop Loss Percent")
useTP = input(false, type=bool, title = "Use Take Profit / Stop Loss")

tp = (close * tpPercent / 100) / syminfo.mintick
sl = (close * slPercent / 100) / syminfo.mintick

fastMA = ema(ohlc4, 12)
slowMA = ema(ohlc4, 26)
macd = fastMA - slowMA
signal = sma(macd, 9)
hist = macd - signal

lMACD = security(tickerid, tostring(longTermTimeFrame), macd)
lSignal = security(tickerid, tostring(longTermTimeFrame), signal)
lHistLine = security(tickerid, tostring(longTermTimeFrame), hist)
lIdx = round(longTermTimeFrame / interval)

mMACD = security(tickerid, tostring(midTermTimeFrame), macd)
mSignal = security(tickerid, tostring(midTermTimeFrame), signal)
mHistLine = security(tickerid, tostring(midTermTimeFrame), hist)
mIdx = round(midTermTimeFrame / interval)

lUp = lHistLine[longTermDelayPeriod * lIdx] > lHistLine[(longTermDelayPeriod + 1) * lIdx]
lDn = lHistLine[longTermDelayPeriod * lIdx] < lHistLine[(longTermDelayPeriod + 1) * lIdx]

mUp = mHistLine[midTermDelayPeriod * mIdx] > mHistLine[(midTermDelayPeriod + 1) * mIdx]
mDn = mHistLine[midTermDelayPeriod * mIdx] < mHistLine[(midTermDelayPeriod + 1) * mIdx]

sUp = hist[midTermDelayPeriod] > hist[midTermDelayPeriod + 1]
sDn = hist[midTermDelayPeriod] < hist[midTermDelayPeriod + 1]

trendUp = lSignal[longTermDelayPeriod * lIdx] > 0
trendDown = lSignal[longTermDelayPeriod * lIdx] < 0

longExit = lDn and mDn and sDn 
shortExit = lUp and mUp and sUp

long = (lUp and mUp and sUp) and (tradeOnLongTermTrendDirection ? trendUp : true)
short = (lDn and mDn and sDn) and (tradeOnLongTermTrendDirection ? trendDown : true)


barcolor(lUp and mUp and sUp ? lime : lUp and mUp and sDn ?  green : lUp and mDn and sDn ? teal : lUp and mDn and sUp ? blue : lDn and mDn and sDn ? red : lDn and mDn and sUp ? orange : lDn and mUp and sUp ? yellow : lDn and mUp and sDn ? maroon : white)


if (long)
    strategy.entry("Long", strategy.long) //comment = tostring(hisline[macdTimeFrame / interval]))
    if (useTP)
        strategy.exit("Exit Long", "Long", profit =  tp, loss = sl)

        
if (longExit)
    strategy.close("Long")
    
if (short)
    strategy.entry("Short", strategy.short)
    if (useTP)
        strategy.exit("Exit Short", "Short", profit =  tp, loss =  sl)


if (shortExit)
    strategy.close("Short")