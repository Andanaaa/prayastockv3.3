import React, { useState, useEffect } from 'react';
import {
  Package,
  PackageCheck,
  PackageMinus,
  FileBarChart,
  LogOut,
} from 'lucide-react';
import { Item, IncomingItem, OutgoingItem, User } from './types';
import { InventoryTable } from './components/InventoryTable';
import { AddItemForm } from './components/AddItemForm';
import { IncomingItems } from './components/IncomingItems';
import { OutgoingItems } from './components/OutgoingItems';
import { SalesReport } from './components/SalesReport';
import { LoginForm } from './components/LoginForm';
import { useLocalStorage } from './hooks/useLocalStorage';

// Demo credentials - in a real app, this would be handled by a backend
const DEMO_USER = {
  username: 'admin',
  password: 'admin123'
};

function App() {
  const [currentTab, setCurrentTab] = useState<
    'inventory' | 'incoming' | 'outgoing' | 'report'
  >('inventory');
  const [items, setItems] = useLocalStorage<Item[]>('inventory-items', []);
  const [incomingItems, setIncomingItems] = useLocalStorage<IncomingItem[]>('incoming-items', []);
  const [outgoingItems, setOutgoingItems] = useLocalStorage<OutgoingItem[]>('outgoing-items', []);
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string>();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const handleLogin = (credentials: User) => {
    if (
      credentials.username === DEMO_USER.username &&
      credentials.password === DEMO_USER.password
    ) {
      const user = { username: credentials.username };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setLoginError(undefined);
    } else {
      setLoginError('Username atau password salah');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleAddItem = (newItem: Omit<Item, 'id' | 'dateAdded' | 'timeAdded'>) => {
    const { date, time } = getCurrentDateTime();
    const item: Item = {
      ...newItem,
      id: Date.now(),
      dateAdded: date,
      timeAdded: time,
    };
    setItems([...items, item]);
  };

  const handleAddMultipleItems = (newItems: Omit<Item, 'id' | 'dateAdded' | 'timeAdded'>[]) => {
    const { date, time } = getCurrentDateTime();
    const itemsToAdd = newItems.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      dateAdded: date,
      timeAdded: time,
    }));
    setItems([...items, ...itemsToAdd]);
  };

  const handleDeleteItem = (id: number) => {
    const hasIncoming = incomingItems.some(item => item.itemId === id);
    const hasOutgoing = outgoingItems.some(item => item.itemId === id);
    
    if (hasIncoming || hasOutgoing) {
      alert('Tidak dapat menghapus barang yang memiliki riwayat transaksi');
      return;
    }
    
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (id: number, newName: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, name: newName } : item
    ));
  };

  const handleAddIncomingItem = (
    incomingItem: Omit<IncomingItem, 'id' | 'date' | 'time'>
  ) => {
    const { date, time } = getCurrentDateTime();
    const newIncomingItem: IncomingItem = {
      ...incomingItem,
      id: Date.now(),
      date,
      time,
    };

    setIncomingItems([...incomingItems, newIncomingItem]);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === incomingItem.itemId
          ? { ...item, stock: item.stock + incomingItem.quantity }
          : item
      )
    );
  };

  const handleAddOutgoingItems = (
    newItems: Omit<OutgoingItem, 'id' | 'date' | 'time'>[]
  ) => {
    const { date, time } = getCurrentDateTime();

    const outgoingItemsToAdd = newItems.map((item) => ({
      ...item,
      id: Date.now() + Math.random(),
      date,
      time,
    }));

    setOutgoingItems([...outgoingItems, ...outgoingItemsToAdd]);

    setItems((currentItems) =>
      currentItems.map((item) => {
        const outgoingItem = newItems.find((oi) => oi.itemId === item.id);
        return outgoingItem
          ? { ...item, stock: item.stock - outgoingItem.quantity }
          : item;
      })
    );
  };

  const handleDeleteSale = (saleId: number) => {
    const saleToDelete = outgoingItems.find(item => item.id === saleId);
    if (saleToDelete) {
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === saleToDelete.itemId
            ? { ...item, stock: item.stock + saleToDelete.quantity }
            : item
        )
      );
      
      setOutgoingItems(currentItems =>
        currentItems.filter(item => item.id !== saleId)
      );
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Stock Praya
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selamat datang, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentTab('inventory')}
                className={`${
                  currentTab === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <Package className="w-5 h-5 mr-2" />
                Stock
              </button>
              <button
                onClick={() => setCurrentTab('incoming')}
                className={`${
                  currentTab === 'incoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <PackageCheck className="w-5 h-5 mr-2" />
                Barang Masuk
              </button>
              <button
                onClick={() => setCurrentTab('outgoing')}
                className={`${
                  currentTab === 'outgoing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <PackageMinus className="w-5 h-5 mr-2" />
                Penjualan
              </button>
              <button
                onClick={() => setCurrentTab('report')}
                className={`${
                  currentTab === 'report'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <FileBarChart className="w-5 h-5 mr-2" />
                Laporan
              </button>
            </nav>
          </div>

          <div className="space-y-6">
            {currentTab === 'inventory' ? (
              <>
                <AddItemForm 
                  onAddItem={handleAddItem}
                  onAddMultipleItems={handleAddMultipleItems}
                />
                {items.length > 0 ? (
                  <InventoryTable 
                    items={items} 
                    onDeleteItem={handleDeleteItem}
                    onEditItem={handleEditItem}
                  />
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Belum ada barang
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Mulai dengan menambahkan barang baru.
                    </p>
                  </div>
                )}
              </>
            ) : currentTab === 'incoming' ? (
              <IncomingItems
                items={items}
                incomingItems={incomingItems}
                onAddIncomingItem={handleAddIncomingItem}
              />
            ) : currentTab === 'outgoing' ? (
              <OutgoingItems
                items={items}
                outgoingItems={outgoingItems}
                onAddOutgoingItems={handleAddOutgoingItems}
              />
            ) : (
              <SalesReport 
                items={items} 
                outgoingItems={outgoingItems}
                onDeleteSale={handleDeleteSale}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;