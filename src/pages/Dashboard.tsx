import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  createStockAccount,
  getStockAccounts,
  getAllStocks,
  logoutUser,
} from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { type StockAccount, type Stock } from "../types";
import AccountDetail from "../components/AccountDetails";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<StockAccount[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const recordRef = useRef<{
    [symbol: string]: { [accountId: string]: boolean, duplicate: boolean };
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        const fetchedAccounts = await getStockAccounts(currentUser.uid);
        setAccounts(fetchedAccounts);

        const fetchedStocks = await getAllStocks(currentUser.uid);

        setStocks(fetchedStocks);

        recordRef.current = {};

        fetchedStocks.forEach((stock) => {
          if (recordRef.current[stock.symbol]) {
            recordRef.current[stock.symbol][stock.accountId] = true;
            recordRef.current[stock.symbol].duplicate = true;
          } else {
            recordRef.current[stock.symbol] = { [stock.accountId]: true, duplicate: false };
          }
        });

      } catch (err) {
        setError("獲取資料失敗");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !newAccountName.trim()) return;

    try {
      const newAccount = await createStockAccount(
        newAccountName,
        currentUser.uid
      );
      setAccounts([...accounts, newAccount]);
      setNewAccountName("");
    } catch (err) {
      setError("創建戶頭失敗");
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      setError("登出失敗");
      console.error(err);
    }
  };

  // 計算每個戶頭中的股票數量
  const getStockCountByAccount = (accountId: string) => {
    return stocks.filter((stock) => stock.accountId === accountId).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">載入中...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的證券戶頭</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          登出
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">新增證券戶頭</h2>
        <form onSubmit={handleCreateAccount} className="flex items-center">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="戶頭名稱"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-r hover:bg-blue-600"
          >
            新增
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            您還沒有任何證券戶頭，請新增一個吧！
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold mb-2">{account.name}</h3>
              <p className="text-gray-600 mb-4">
                股票數量: {getStockCountByAccount(account.id)}
              </p>


              <AccountDetail
                accountId={account.id}
                stockRecord={recordRef.current}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
