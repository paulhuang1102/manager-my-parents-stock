import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getStocksByAccount,
  addStockToAccount,
  toggleStockMarked,
} from "../services/firebase";
import { type Stock } from "../types";

interface IProps {
  accountId: string;
  stockRecord: {
    [symbol: string]: { [accountId: string]: boolean; duplicate: boolean };
  };
}

const AccountDetail: React.FC<IProps> = ({ accountId, stockRecord }) => {
  const { currentUser } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [symbol, setSymbol] = useState("");
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [opened, setOpened] = useState<boolean>(true);

  useEffect(() => {
    const fetchStocks = async () => {
      if (!accountId) return;

      try {
        const fetchedStocks = await getStocksByAccount(accountId);
        setStocks(fetchedStocks);
      } catch (err) {
        setError("獲取股票資料失敗");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [accountId]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !accountId) return;

    try {
      const newStock = await addStockToAccount(
        accountId,
        currentUser.uid,
        symbol,
        stockName,
        Number(quantity)
      );

      setStocks([...stocks, newStock]);
      setSymbol("");
      setStockName("");
      setQuantity("");
    } catch (err) {
      setError("新增股票失敗");
      console.error(err);
    }
  };

  const handleToggleMark = async (stock: Stock) => {
    if (!currentUser) return;

    try {
      await toggleStockMarked(stock.symbol, currentUser.uid, !stock.isMarked);

      setStocks(
        stocks.map((s) =>
          s.symbol === stock.symbol ? { ...s, isMarked: !stock.isMarked } : s
        )
      );
    } catch (err) {
      setError("標記股票失敗");
      console.error(err);
    }
  };

  const toggle = () => {
    setOpened(!opened);
  };

  console.log(accountId, stocks);

  if (!accountId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">載入中...</div>
    );
  }

  return (
    <div>
      <div className="flex justify-between align-center">
        <p className="font-bold">證券戶頭詳情</p>

        <button onClick={toggle} type="button">
          {opened ? "收起" : "展開"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div
        className={`ransition-all duration-300 ease-in-out overflow-hidden ${
          opened ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">新增股票</h2>
          <form
            onSubmit={handleAddStock}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="symbol"
                >
                  股票代號
                </label>
                <input
                  id="symbol"
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  股票名稱
                </label>
                <input
                  id="name"
                  type="text"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="quantity"
                >
                  數量
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                新增股票
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">股票列表</h2>

          {stocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
              此戶頭還沒有任何股票，請新增一支吧！
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">代號</th>
                    <th className="py-3 px-4 text-left">名稱</th>
                    <th className="py-3 px-4 text-left">數量</th>
                    <th className="py-3 px-4 text-left">標記</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className={`border-t hover:bg-gray-50 ${
                        stockRecord[stock.symbol].duplicate &&
                        stockRecord[stock.symbol][accountId]
                          ? "bg-yellow-100"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4">{stock.symbol}</td>
                      <td className="py-3 px-4">{stock.name}</td>
                      <td className="py-3 px-4">{stock.quantity}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleMark(stock)}
                          className={`p-2 rounded ${
                            stock.isMarked
                              ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {stock.isMarked ? "已標記 ★" : "標記 ☆"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
