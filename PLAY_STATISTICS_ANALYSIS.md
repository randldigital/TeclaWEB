# Play Statistics Analysis & Implementation Plan

## **🎯 Overview**

This document analyzes how to implement comprehensive play statistics including tickets booked, tickets paid, money expected, and money gathered in the current TeclaWEB theater application.

## **📊 Current Database Schema Analysis**

### **Relevant Tables**

#### **1. Plays Table**
```sql
CREATE TABLE plays (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT,
  date_time DATETIME NOT NULL,
  base_price REAL DEFAULT 5.0 NOT NULL,
  genre TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  parent_play_id TEXT,
  showtime_order INTEGER
);
```

#### **2. Tickets Table**
```sql
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  play_id TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  seat_number TEXT,
  status TEXT DEFAULT 'Pendiente' NOT NULL,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### **Current Data Structure**
- **Plays**: Have `base_price` field for pricing
- **Tickets**: Have `status` ('Pendiente'/'Pagado') and `paid_at` timestamp
- **Relationships**: Tickets link to plays via `play_id`

## **📈 Statistics to Calculate**

### **1. Basic Statistics**
- **Tickets Booked**: Total tickets created for a play
- **Tickets Paid**: Tickets with status 'Pagado'
- **Tickets Pending**: Tickets with status 'Pendiente'
- **Payment Rate**: Percentage of paid tickets

### **2. Financial Statistics**
- **Money Expected**: Total potential revenue (all tickets × base price)
- **Money Gathered**: Actual revenue (paid tickets × base price)
- **Outstanding Amount**: Expected - Gathered
- **Average Revenue per Ticket**: Gathered / Paid tickets

### **3. Advanced Statistics**
- **Showtime Performance**: Compare multiple showtimes of same play
- **Genre Performance**: Compare plays by genre
- **Time-based Analysis**: Revenue trends over time
- **Occupancy Rate**: Tickets sold vs capacity (if capacity is defined)

## **🔧 Implementation Plan**

### **Phase 1: Backend Statistics Functions**

#### **1.1 Add Statistics Methods to Storage**

**File**: `server/storage-db.ts`

```typescript
// Add to IStorage interface
interface PlayStatistics {
  playId: string;
  playTitle: string;
  totalTickets: number;
  paidTickets: number;
  pendingTickets: number;
  paymentRate: number;
  moneyExpected: number;
  moneyGathered: number;
  outstandingAmount: number;
  averageRevenuePerTicket: number;
  lastTicketDate?: Date;
  firstTicketDate?: Date;
}

// Add methods to Storage class
async getPlayStatistics(playId: string): Promise<PlayStatistics>
async getAllPlaysStatistics(): Promise<PlayStatistics[]>
async getPlaysStatisticsByDateRange(startDate: Date, endDate: Date): Promise<PlayStatistics[]>
```

#### **1.2 SQL Queries for Statistics**

```sql
-- Basic play statistics
SELECT 
  p.id as play_id,
  p.title as play_title,
  p.base_price,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) as paid_tickets,
  COUNT(CASE WHEN t.status = 'Pendiente' THEN 1 END) as pending_tickets,
  ROUND(COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) * 100.0 / COUNT(t.id), 2) as payment_rate,
  COUNT(t.id) * p.base_price as money_expected,
  COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) * p.base_price as money_gathered,
  (COUNT(t.id) - COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END)) * p.base_price as outstanding_amount,
  CASE 
    WHEN COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) > 0 
    THEN ROUND(COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) * p.base_price / COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END), 2)
    ELSE 0 
  END as avg_revenue_per_ticket,
  MAX(t.created_at) as last_ticket_date,
  MIN(t.created_at) as first_ticket_date
FROM plays p
LEFT JOIN tickets t ON p.id = t.play_id
WHERE p.id = ?
GROUP BY p.id, p.title, p.base_price;
```

### **Phase 2: API Endpoints**

#### **2.1 Add Statistics Routes**

**File**: `server/routes.ts`

```typescript
// Get statistics for a specific play
app.get("/api/plays/:id/statistics", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
  try {
    const statistics = await storage.getPlayStatistics(req.params.id);
    if (!statistics) {
      return res.status(404).json({ message: "Play not found" });
    }
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching play statistics:", error);
    res.status(500).json({ message: "Error fetching play statistics" });
  }
});

// Get statistics for all plays
app.get("/api/plays-statistics", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let statistics;
    
    if (startDate && endDate) {
      statistics = await storage.getPlaysStatisticsByDateRange(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      statistics = await storage.getAllPlaysStatistics();
    }
    
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching plays statistics:", error);
    res.status(500).json({ message: "Error fetching plays statistics" });
  }
});
```

### **Phase 3: Frontend Components**

#### **3.1 Play Statistics Component**

**File**: `client/src/components/play-statistics.tsx`

```typescript
interface PlayStatisticsProps {
  playId: string;
  showDetails?: boolean;
}

export function PlayStatistics({ playId, showDetails = false }: PlayStatisticsProps) {
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["/api/plays", playId, "statistics"],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${playId}/statistics`);
      if (!response.ok) throw new Error("Error fetching statistics");
      return response.json();
    },
  });

  if (isLoading) return <StatisticsSkeleton />;
  if (!statistics) return <div>No statistics available</div>;

  return (
    <div className="space-y-4">
      {/* Basic Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={statistics.totalTickets}
          icon={Ticket}
          color="blue"
        />
        <StatCard
          title="Paid Tickets"
          value={statistics.paidTickets}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Tickets"
          value={statistics.pendingTickets}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Payment Rate"
          value={`${statistics.paymentRate}%`}
          icon={Percent}
          color="purple"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinancialCard
          title="Money Expected"
          value={statistics.moneyExpected}
          subtitle="Total potential revenue"
          color="blue"
        />
        <FinancialCard
          title="Money Gathered"
          value={statistics.moneyGathered}
          subtitle="Actual revenue"
          color="green"
        />
        <FinancialCard
          title="Outstanding"
          value={statistics.outstandingAmount}
          subtitle="Pending payments"
          color="red"
        />
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Average Revenue/Ticket</p>
              <p className="font-semibold">€{statistics.averageRevenuePerTicket}</p>
            </div>
            <div>
              <p className="text-gray-600">First Ticket</p>
              <p className="font-semibold">{formatDate(statistics.firstTicketDate)}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Ticket</p>
              <p className="font-semibold">{formatDate(statistics.lastTicketDate)}</p>
            </div>
            <div>
              <p className="text-gray-600">Base Price</p>
              <p className="font-semibold">€{statistics.basePrice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### **3.2 Statistics Dashboard Component**

**File**: `client/src/components/statistics-dashboard.tsx`

```typescript
export function StatisticsDashboard() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  const { data: allStatistics, isLoading } = useQuery({
    queryKey: ["/api/plays-statistics", dateRange],
    queryFn: async () => {
      const params = dateRange 
        ? `?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`
        : '';
      const response = await fetch(`/api/plays-statistics${params}`);
      if (!response.ok) throw new Error("Error fetching statistics");
      return response.json();
    },
  });

  const totalStats = useMemo(() => {
    if (!allStatistics) return null;
    
    return allStatistics.reduce((acc, stat) => ({
      totalTickets: acc.totalTickets + stat.totalTickets,
      paidTickets: acc.paidTickets + stat.paidTickets,
      moneyExpected: acc.moneyExpected + stat.moneyExpected,
      moneyGathered: acc.moneyGathered + stat.moneyGathered,
    }), {
      totalTickets: 0,
      paidTickets: 0,
      moneyExpected: 0,
      moneyGathered: 0,
    });
  }, [allStatistics]);

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center space-x-4">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        <Button onClick={() => setDateRange(null)}>
          Clear Filter
        </Button>
      </div>

      {/* Overall Statistics */}
      {totalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tickets"
            value={totalStats.totalTickets}
            icon={Ticket}
            color="blue"
          />
          <StatCard
            title="Paid Tickets"
            value={totalStats.paidTickets}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Expected"
            value={`€${totalStats.moneyExpected.toFixed(2)}`}
            icon={Euro}
            color="purple"
          />
          <StatCard
            title="Total Gathered"
            value={`€${totalStats.moneyGathered.toFixed(2)}`}
            icon={Banknote}
            color="green"
          />
        </div>
      )}

      {/* Individual Play Statistics */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Play Statistics</h3>
        {allStatistics?.map((stat) => (
          <PlayStatisticsCard key={stat.playId} statistics={stat} />
        ))}
      </div>
    </div>
  );
}
```

### **Phase 4: Integration Points**

#### **4.1 Admin Dashboard Enhancement**

**File**: `client/src/pages/admin-dashboard.tsx`

```typescript
// Add new tab for statistics
<TabsContent value="statistics" className="space-y-6">
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-claret-blue">Estadísticas</h2>
  </div>
  <StatisticsDashboard />
</TabsContent>
```

#### **4.2 Play Detail Page Enhancement**

**File**: `client/src/pages/event-detail.tsx`

```typescript
// Add statistics section for admins/monitors
{user && ['ADMIN', 'MONITOR'].includes(user.role) && (
  <Card className="mt-8">
    <CardHeader>
      <CardTitle className="text-claret-blue flex items-center">
        <BarChart className="w-5 h-5 mr-2" />
        Estadísticas de la Obra
      </CardTitle>
    </CardHeader>
    <CardContent>
      <PlayStatistics playId={play.id} showDetails={true} />
    </CardContent>
  </Card>
)}
```

## **📊 Data Visualization Options**

### **1. Charts and Graphs**
- **Bar Charts**: Compare plays by revenue
- **Pie Charts**: Payment status distribution
- **Line Charts**: Revenue trends over time
- **Heatmaps**: Performance by day/time

### **2. Export Features**
- **PDF Reports**: Detailed statistics reports
- **CSV Export**: Raw data for external analysis
- **Email Reports**: Automated weekly/monthly reports

## **🔒 Security Considerations**

### **1. Access Control**
- Statistics only visible to ADMIN and MONITOR roles
- Individual play statistics restricted to play creators
- Audit logging for statistics access

### **2. Data Privacy**
- No personal user information in statistics
- Aggregated data only
- Compliance with data protection regulations

## **🚀 Implementation Timeline**

### **Week 1: Backend Foundation**
- Add statistics methods to storage layer
- Create SQL queries for calculations
- Add API endpoints
- Unit tests for statistics functions

### **Week 2: Frontend Components**
- Create PlayStatistics component
- Create StatisticsDashboard component
- Add date range filtering
- Basic data visualization

### **Week 3: Integration & Enhancement**
- Integrate into admin dashboard
- Add to play detail pages
- Advanced visualizations
- Export functionality

### **Week 4: Testing & Polish**
- End-to-end testing
- Performance optimization
- UI/UX improvements
- Documentation

## **📈 Expected Benefits**

### **For Administrators**
1. **Financial Oversight**: Clear view of revenue and outstanding payments
2. **Performance Analysis**: Compare plays and identify successful patterns
3. **Resource Planning**: Better allocation of resources based on performance
4. **Decision Making**: Data-driven decisions for future productions

### **For Monitors/Teachers**
1. **Play Performance**: Track individual play success
2. **Student Engagement**: Monitor ticket sales and participation
3. **Budget Management**: Understand revenue vs expenses
4. **Reporting**: Generate reports for school administration

### **For the Application**
1. **Professional Features**: Enhanced admin capabilities
2. **Data Insights**: Valuable analytics for business intelligence
3. **User Engagement**: Better understanding of user behavior
4. **Scalability**: Foundation for advanced analytics features

## **✅ Conclusion**

The implementation of comprehensive play statistics will provide valuable insights into the theater's performance, financial health, and user engagement. The modular approach allows for gradual implementation and easy extension of features.

The system will enable administrators and monitors to make data-driven decisions, optimize resource allocation, and improve the overall theater experience for students and audiences.
