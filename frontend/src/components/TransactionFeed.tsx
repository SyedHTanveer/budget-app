import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Coffee, 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { useGetTransactionsQuery, useUpdateTransactionCategoryMutation, useGetBudgetCategoriesQuery, useGetAccountsQuery } from "../store/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { toast } from 'sonner';
import { useDebounce } from '../hooks';
import { Skeleton } from "./ui/skeleton";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  icon: React.ReactNode;
  pending?: boolean;
}

export function TransactionFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useGetTransactionsQuery({ page, limit: 10, category: selectedCategory && selectedCategory !== 'All' ? selectedCategory : undefined, q: debouncedSearch || undefined, min_amount: minAmount ? parseFloat(minAmount) : undefined, max_amount: maxAmount ? parseFloat(maxAmount) : undefined, account_id: accountId || undefined, start_date: startDate || undefined, end_date: endDate || undefined });
  const transactions = (data?.transactions || []).map((t: any) => ({
    id: t.id,
    description: t.name || t.description,
    amount: t.amount,
    type: t.amount > 0 ? 'income' : 'expense',
    category: t.category || t.primary_category || 'Uncategorized',
    date: t.date || t.posted_at || '',
    icon: t.amount > 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />,
    pending: t.pending
  }));

  const { data: categoriesData } = useGetBudgetCategoriesQuery();
  const { data: accountsData } = useGetAccountsQuery();
  const categoryOptions: string[] = ['All', ...(categoriesData ? categoriesData.map((c:any)=>c.name) : [])];
  const [updateCategory] = useUpdateTransactionCategoryMutation();
  const [editingId, setEditingId] = useState<string|number|null>(null);
  const [editingValue, setEditingValue] = useState('');

  const filteredTransactions = selectedCategory && selectedCategory !== 'All' 
    ? transactions.filter((t: any) => t.category === selectedCategory)
    : transactions;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Drink': 'bg-orange-100 text-orange-700',
      'Shopping': 'bg-purple-100 text-purple-700',
      'Transport': 'bg-blue-100 text-blue-700',
      'Bills': 'bg-red-100 text-red-700',
      'Income': 'bg-green-100 text-green-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const hasMore = data?.pagination ? page < data.pagination.pages : (transactions.length === 10);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Recent Transactions</h2>
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categoryOptions.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedCategory(category); setPage(1); }}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Search and Amount Filter */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col w-40">
          <label className="text-xs text-muted-foreground">Account</label>
          <select value={accountId} onChange={e=>{ setAccountId(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs">
            <option value="">All</option>
            {accountsData?.accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">From</label>
          <input type="date" value={startDate} onChange={e=>{ setStartDate(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={endDate} onChange={e=>{ setEndDate(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Search</label>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs" placeholder="Description" />
        </div>
        <div className="flex flex-col w-20">
          <label className="text-xs text-muted-foreground">Min $</label>
          <input value={minAmount} onChange={e=>{ setMinAmount(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs" />
        </div>
        <div className="flex flex-col w-20">
          <label className="text-xs text-muted-foreground">Max $</label>
            <input value={maxAmount} onChange={e=>{ setMaxAmount(e.target.value); setPage(1); }} className="border px-2 py-1 rounded text-xs" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.map((transaction: any) => (
          <Card key={transaction.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {transaction.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate max-w-[200px]" title={transaction.description}>{transaction.description}</span>
                    {transaction.pending && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {editingId === transaction.id ? (
                      <Select
                        value={editingValue}
                        onValueChange={async (val: string)=>{
                          setEditingValue(val);
                          try {
                            await updateCategory({ id: transaction.id, category: val }).unwrap();
                            toast.success('Category updated');
                          } catch (e:any) {
                            toast.error(e.message||'Update failed');
                          } finally {
                            setEditingId(null);
                          }
                        }}
                      >
                        <SelectTrigger className="h-6 px-2 text-xs w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs max-h-64">
                          {categoryOptions.filter(c=>c!=='All').map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge 
                        onClick={()=>{ setEditingId(transaction.id); setEditingValue(transaction.category); }}
                        variant="outline" 
                        className={`text-xs cursor-pointer ${getCategoryColor(transaction.category)}`}
                        title="Click to change category"
                      >
                        {transaction.category}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {transaction.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`text-right ${
                transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
              }`}>
                <div className="font-medium">
                  {transaction.type === 'income' ? '+' : ''}
                  ${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" size="sm" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={()=>setPage(p=>p+1)}>Next</Button>
      </div>
    </div>
  );
}