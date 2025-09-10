import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { classifyUsagePercent, severityTokens } from '../../lib/severity'

interface UpcomingBill {
  id: string
  name: string
  amount: number
  dueDate: Date
}

// Placeholder mock (replace with real API hook later)
function usePayPeriodData() {
  const now = new Date()
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of month
  const totalDays = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / 86400000) + 1
  const elapsedDays = Math.min(totalDays, Math.floor((now.getTime() - cycleStart.getTime()) / 86400000) + 1)
  // Assume semi-monthly pay (1st & 15th) for placeholder
  const midMonth = new Date(now.getFullYear(), now.getMonth(), 15)
  const nextPayDate = now < midMonth ? midMonth : new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const upcomingBills: UpcomingBill[] = [
    { id: 'r1', name: 'Rent', amount: 1450, dueDate: new Date(now.getFullYear(), now.getMonth(), 3) },
    { id: 'u1', name: 'Utilities', amount: 180, dueDate: new Date(now.getFullYear(), now.getMonth(), 10) },
    { id: 's1', name: 'Streaming', amount: 28, dueDate: new Date(now.getFullYear(), now.getMonth(), 12) },
    { id: 'i1', name: 'Insurance', amount: 95, dueDate: new Date(now.getFullYear(), now.getMonth(), 20) }
  ].filter(b => b.dueDate >= now) // only upcoming

  const billsTotal = upcomingBills.reduce((s, b) => s + b.amount, 0)
  const availableCash = 4200 // placeholder
  const coverageRatio = billsTotal / Math.max(availableCash, 1) // higher = worse
  const severity = classifyUsagePercent(coverageRatio)

  return { now, cycleStart, cycleEnd, totalDays, elapsedDays, nextPayDate, upcomingBills, billsTotal, availableCash, coverageRatio, severity }
}

export function PayPeriodCard() {
  const data = usePayPeriodData()
  const sevTokens = severityTokens[data.severity]
  const periodLabel = data.cycleStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + data.cycleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const nextPayLabel = data.nextPayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const coveragePct = (data.coverageRatio * 100).toFixed(1)
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pay Period Overview</CardTitle>
        <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${sevTokens.text}`}>{data.severity}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-xs text-neutral-300">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase text-neutral-500">Period</p>
            <p className="font-medium text-neutral-200">{periodLabel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-neutral-500">Next Pay</p>
            <p className="font-medium text-neutral-200">{nextPayLabel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-neutral-500">Elapsed</p>
            <p className="font-medium text-neutral-200">{data.elapsedDays}d / {data.totalDays}d</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-neutral-500">Bills Left</p>
            <p className="font-medium text-neutral-200">{data.upcomingBills.length} (${data.billsTotal.toLocaleString(undefined,{maximumFractionDigits:0})})</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase text-neutral-500 mb-1">Progress</p>
            <Progress className="h-2" value={(data.elapsedDays / data.totalDays) * 100} />
          </div>
        </div>
        <div className="rounded-sm border border-neutral-700/40 p-2 bg-neutral-900/40">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Bills Coverage</p>
          <p className={`text-sm font-medium ${sevTokens.text}`}>{coveragePct}% of available cash reserved</p>
          <p className="text-[10px] text-neutral-500 mt-1">Lower is healthier. &lt;50% good, 50–85% caution, &gt;85% danger.</p>
        </div>
      </CardContent>
    </Card>
  )
}

