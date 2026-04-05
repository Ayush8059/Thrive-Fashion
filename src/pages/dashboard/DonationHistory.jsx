import { useEffect, useState } from "react";
import { HeartHandshake, Loader2, Leaf, Droplets, Trash2 } from "lucide-react";
import {
  buildDonationImpactSummary,
  clearDonations,
  deleteDonation,
  getDonationHistory,
  getDonationImpactSummary,
} from "../../services/donation";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  picked_up: "bg-violet-100 text-violet-700",
  received: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    loadDonationData();
  }, []);

  const loadDonationData = async () => {
    setLoading(true);
    setError("");
    try {
      const [history, impact] = await Promise.all([
        getDonationHistory(),
        getDonationImpactSummary(),
      ]);
      setDonations(history);
      setSummary(impact);
    } catch (err) {
      setError(err.message || "Unable to load donation history.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (donationId) => {
    if (!window.confirm("Remove this donation entry from your tracking history?")) return;

    setRemovingId(donationId);
    setError("");
    try {
      await deleteDonation(donationId);
      setDonations((prev) => {
        const next = prev.filter((entry) => entry.id !== donationId);
        setSummary(buildDonationImpactSummary(next));
        return next;
      });
    } catch (err) {
      setError(err.message || "Unable to remove donation entry.");
    } finally {
      setRemovingId("");
    }
  };

  const handleClearAll = async () => {
    if (!donations.length) return;
    if (!window.confirm("Clear all donation tracking entries from this page?")) return;

    setClearingAll(true);
    setError("");
    try {
      await clearDonations(donations.map((entry) => entry.id));
      setDonations([]);
      setSummary(buildDonationImpactSummary([]));
    } catch (err) {
      setError(err.message || "Unable to clear donation history.");
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Donation Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Follow every donation request and its sustainability impact.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {summary && (
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Donation requests</p>
                <p className="text-3xl font-bold">{summary.totalDonations}</p>
              </div>
              <div className="card">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Water saved
                </div>
                <p className="text-3xl font-bold">{summary.waterSavedLitres.toLocaleString()}L</p>
              </div>
              <div className="card">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <Leaf className="h-4 w-4 text-green-500" />
                  CO2 reduced
                </div>
                <p className="text-3xl font-bold">{summary.co2ReducedKg}kg</p>
              </div>
            </div>
          )}

          {donations.length > 0 && (
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearingAll}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {clearingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear all
              </button>
            </div>
          )}

          {donations.length === 0 ? (
            <div className="card py-16 text-center">
              <HeartHandshake className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h2 className="text-xl font-bold mb-2">No donation requests yet</h2>
              <p className="text-gray-500">Donated items will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={donation.item?.image_url || "https://placehold.co/160x200?text=Item"}
                      alt={donation.item?.title || "Donation item"}
                      className="h-20 w-16 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {donation.item?.title || "Item"}
                      </h3>
                      <p className="text-sm text-gray-500">{donation.ngo_name || "NGO partner"}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {donation.donation_method || "pickup"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        STATUS_STYLES[donation.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(donation.status || "pending").replace("_", " ")}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(donation.created_at).toLocaleString()}
                    </p>
                    {donation.notes && (
                      <p className="mt-1 text-sm text-gray-500">{donation.notes}</p>
                    )}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(donation.id)}
                        disabled={removingId === donation.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {removingId === donation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
