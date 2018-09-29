//@version=3
study("4All-Alert", shorttitle = "Alerts")

src = close
len = input(4, minval = 1, title = "Length")

up = rma(max(change(src), 0), len)
down = rma(-min(change(src), 0), len)
rsi = down == 0 ? 100 : up == 0 ? 0 : 100 - (100 / (1 + up / down))

rsin = input(5)
sn = 100 - rsin
ln = 0 + rsin

short = crossover(rsi, sn) ? 1 : 0
long = crossunder(rsi, ln) ? 1 : 0

plot(long, "Long", color = green)
plot(short, "Short", color = red)