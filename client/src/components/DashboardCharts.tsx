import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Project {
  id: number;
  name: string;
  color: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Invoice {
  id: number;
  userId: number;
  toolName: string | null;
  companyName: string | null;
  amount: number;
  currency: string;
  invoiceDate: Date | null;
  month: string;
  fileUrl: string | null;
  status: string;
  projectId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardChartsProps {
  projects: Project[];
  invoices: Invoice[];
  exchangeRate: number;
}

export default function DashboardCharts({ projects, invoices, exchangeRate }: DashboardChartsProps) {
  const convertToEUR = (amount: number, currency: string) => {
    if (currency === "EUR") return amount;
    return Math.round(amount * exchangeRate);
  };

  // Prepare data for project spending chart
  const projectSpendingData = projects.map((project) => {
    const projectInvoices = invoices.filter((inv) => inv.projectId === project.id);
    const totalAmount = projectInvoices.reduce((sum, inv) => {
      return sum + convertToEUR(inv.amount, inv.currency);
    }, 0);

    return {
      name: project.name,
      amount: totalAmount / 100, // Convert cents to euros
      color: project.color || "#000000",
    };
  });

  // Add unassigned invoices
  const unassignedInvoices = invoices.filter((inv) => !inv.projectId);
  if (unassignedInvoices.length > 0) {
    const unassignedTotal = unassignedInvoices.reduce((sum, inv) => {
      return sum + convertToEUR(inv.amount, inv.currency);
    }, 0);
    projectSpendingData.push({
      name: "Ohne Projekt",
      amount: unassignedTotal / 100,
      color: "#6b7280",
    });
  }

  // Prepare data for monthly spending chart
  const monthlySpendingMap = new Map<string, number>();
  invoices.forEach((invoice) => {
    const month = invoice.month;
    const amountEUR = convertToEUR(invoice.amount, invoice.currency);
    monthlySpendingMap.set(month, (monthlySpendingMap.get(month) || 0) + amountEUR);
  });

  const monthlySpendingData = Array.from(monthlySpendingMap.entries())
    .map(([month, amount]) => ({
      month,
      amount: amount / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            €{payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (projectSpendingData.length === 0 && monthlySpendingData.length === 0) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Project Spending Bar Chart */}
      {projectSpendingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ausgaben pro Projekt</CardTitle>
            <CardDescription>Gesamtausgaben nach Projekten aufgeschlüsselt</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectSpendingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: '€', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {projectSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Project Spending Pie Chart */}
      {projectSpendingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ausgabenverteilung</CardTitle>
            <CardDescription>Prozentuale Verteilung der Ausgaben</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectSpendingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {projectSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Spending Chart */}
      {monthlySpendingData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monatliche Ausgaben</CardTitle>
            <CardDescription>Ausgabenverlauf über die Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpendingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: '€', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

