import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, HeartHandshake, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { createNotification } from "../../services/notifications";

const STATUS_FILTERS = ["All","pending","scheduled","picked_up","received","completed","cancelled"];

const statusStyle = (status) => {
  const map = {
    completed: { bg:"rgba(16,185,129,0.15)", color:"#34d399", border:"rgba(16,185,129,0.2)" },
    received: { bg:"rgba(5,150,105,0.15)", color:"#10b981", border:"rgba(5,150,105,0.2)" },
    picked_up: { bg:"rgba(139,92,246,0.15)", color:"#a78bfa", border:"rgba(139,92,246,0.2)" },
    scheduled: { bg:"rgba(59,130,246,0.15)", color:"#60a5fa", border:"rgba(59,130,246,0.2)" },
    cancelled: { bg:"rgba(239,68,68,0.15)",  color:"#f87171", border:"rgba(239,68,68,0.2)"  },
    pending:  { bg:"rgba(245,158,11,0.15)", color:"#fbbf24", border:"rgba(245,158,11,0.2)" },
  };
  return map[status?.toLowerCase()] || map.pending;
};

export default function AdminDonations() {
  const PAGE_SIZE = 10;
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("All");
  const [donations, setDonations]       = useState([]);
  const [page, setPage]                 = useState(1);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showFilter, setShowFilter]     = useState(false);
  const [savingId, setSavingId]         = useState(null);

  useEffect(() => { fetchDonations(); }, [page]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const fetchDonations = async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: de, count } = await supabase
        .from("donations")
        .select("id, status, ngo_name, donation_method, created_at, user_id, item_id, pickup_date, completed_at", { count: "exact" })
        .order("created_at",{ascending:false})
        .range(from, to);
      if (de) throw de;
      setTotalDonations(count || 0);
      if (!data?.length) { setDonations([]); return; }

      const userIds = [...new Set(data.map(d=>d.user_id).filter(Boolean))];
      const itemIds = [...new Set(data.map(d=>d.item_id).filter(Boolean))];

      const [{ data: profiles }, { data: items }] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name").in("id",userIds),
        supabase.from("items").select("id,title,image_url").in("id",itemIds),
      ]);

      const profileMap = Object.fromEntries((profiles||[]).map(p=>[p.id,p]));
      const itemMap    = Object.fromEntries((items||[]).map(i=>[i.id,i]));

      setDonations(data.map(d=>({
        ...d,
        profile: profileMap[d.user_id]||null,
        item:    itemMap[d.item_id]||null,
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (donation, newStatus) => {
    if (!donation?.id || savingId === donation.id || donation.status === newStatus) return;

    setSavingId(donation.id);
    setError(null);

    const updatePayload = { status: newStatus };
    if (newStatus === "scheduled" && !donation.pickup_date) {
      updatePayload.pickup_date = new Date().toISOString();
    }
    if (newStatus === "completed" && !donation.completed_at) {
      updatePayload.completed_at = new Date().toISOString();
    }

    try {
      const { data, error: updateError } = await supabase
        .from("donations")
        .update(updatePayload)
        .eq("id", donation.id)
        .select("id, status, pickup_date, completed_at")
        .single();

      if (updateError) throw updateError;

      setDonations((prev) =>
        prev.map((entry) =>
          entry.id === donation.id
            ? {
                ...entry,
                status: data.status,
                pickup_date: data.pickup_date,
                completed_at: data.completed_at,
              }
            : entry
        )
      );

      if (donation.user_id) {
        const statusLabel = newStatus.replace("_", " ");
        const { error: notificationError } = await createNotification({
          userId: donation.user_id,
          title: "Donation status updated",
          message: `${donation.item?.title || "Your donation"} is now ${statusLabel}.`,
          type: "success",
          itemId: donation.item_id,
        });

        if (notificationError) {
          console.error("Donation notification error:", notificationError);
        }
      }
    } catch (err) {
      setError(err.message || "Unable to update donation status.");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = donations.filter(d => {
    const term = search.toLowerCase();
    const matchSearch = d.item?.title?.toLowerCase().includes(term) ||
                        d.profile?.email?.toLowerCase().includes(term) ||
                        d.ngo_name?.toLowerCase().includes(term);
    const matchFilter = filter==="All" || d.status?.toLowerCase()===filter;
    return matchSearch && matchFilter;
  });
  const totalPages = Math.max(1, Math.ceil(totalDonations / PAGE_SIZE));

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:28,fontWeight:800,color:"white",margin:0,
          background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Donations
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)",marginTop:4,fontSize:13 }}>
          Track and update donation logistics from request to completion
        </p>
      </div>

      {/* Filter bar */}
      <div className="space-card" style={{padding:20}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 260px",maxWidth:380}}>
            <Search size={16} color="rgba(255,255,255,0.3)"
              style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}/>
            <input type="text" placeholder="Search by item, email, or NGO…"
              value={search} onChange={e=>setSearch(e.target.value)}
              className="space-input" style={{paddingLeft:40}}/>
          </div>

          <div style={{position:"relative"}}>
            <button onClick={()=>setShowFilter(v=>!v)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
                background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10,color:"rgba(255,255,255,0.7)",cursor:"pointer",
                fontFamily:"'Inter',sans-serif",fontSize:13 }}>
              <Filter size={14}/>{filter==="All"?"Filter Status":filter}
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                  style={{ position:"absolute",top:"calc(100%+8px)",right:0,
                    background:"rgba(10,15,46,0.98)",border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:12,overflow:"hidden",zIndex:50,minWidth:160,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                  {STATUS_FILTERS.map(s=>(
                    <button key={s} onClick={()=>{setFilter(s);setShowFilter(false);}}
                      style={{ display:"block",width:"100%",textAlign:"left",padding:"10px 16px",
                        background:filter===s?"rgba(99,102,241,0.15)":"transparent",
                        color:filter===s?"#818cf8":"rgba(255,255,255,0.65)",
                        border:"none",cursor:"pointer",fontSize:13,
                        fontFamily:"'Inter',sans-serif",fontWeight:filter===s?600:400,
                        textTransform:"capitalize",transition:"background 0.15s" }}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",
            background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:8,padding:"6px 14px" }}>
            {filtered.length} donation{filtered.length!==1?"s":""}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding:"10px 14px",background:"rgba(239,68,68,0.12)",
          border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,color:"#f87171",fontSize:13 }}>
          Error: {error}
        </div>
      )}

      {/* Table */}
      <div className="space-card" style={{padding:0,overflow:"hidden"}}>
        {loading ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200}}>
            <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid transparent",
              borderTopColor:"#ec4899",borderRightColor:"#8b5cf6",animation:"spin-dash 1s linear infinite"}}/>
            <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.3)"}}>
            <HeartHandshake size={48} style={{marginBottom:12,opacity:0.15}}/>
            <p style={{margin:0,fontSize:14}}>
              {search||filter!=="All" ? "No donations match your filters" : "No donations found"}
            </p>
          </div>
      ) : (
        <>
          <div style={{overflowX:"auto"}}>
            <table className="space-table" style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  <th style={{textAlign:"left",padding:"14px 20px"}}>Item</th>
                  <th style={{textAlign:"left"}}>Donor</th>
                  <th style={{textAlign:"left"}}>NGO</th>
                  <th style={{textAlign:"left"}}>Method</th>
                  <th style={{textAlign:"left"}}>Status</th>
                  <th style={{textAlign:"right",padding:"14px 20px"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(don => {
                  const ss = statusStyle(don.status);
                  const isSaving = savingId === don.id;
                  return (
                    <tr key={don.id}>
                      {/* Item */}
                      <td style={{padding:"14px 20px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{ width:40,height:40,borderRadius:8,overflow:"hidden",
                            background:"rgba(255,255,255,0.05)",flexShrink:0 }}>
                            {don.item?.image_url ? (
                              <img src={don.item.image_url} alt={don.item.title}
                                style={{width:"100%",height:"100%",objectFit:"cover"}}
                                onError={e=>{e.target.style.display="none";}}/>
                            ) : (
                              <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
                                justifyContent:"center",color:"rgba(255,255,255,0.2)",fontSize:18}}>📦</div>
                            )}
                          </div>
                          <span style={{fontSize:13,fontWeight:600,color:"white",
                            maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {don.item?.title||"Unknown Item"}
                          </span>
                        </div>
                      </td>
                      {/* Donor */}
                      <td style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>
                        {don.profile?.email||"—"}
                      </td>
                      {/* NGO */}
                      <td style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>
                        {don.ngo_name||"—"}
                      </td>
                      {/* Method */}
                      <td>
                        <span style={{ fontSize:11,padding:"3px 10px",borderRadius:12,fontWeight:600,
                          background:"rgba(99,102,241,0.12)",color:"#a5b4fc",
                          border:"1px solid rgba(99,102,241,0.2)",textTransform:"capitalize" }}>
                          {don.donation_method||"—"}
                        </span>
                      </td>
                      {/* Status */}
                      <td>
                        <span style={{ fontSize:10,padding:"3px 10px",borderRadius:12,fontWeight:700,
                          background:ss.bg,color:ss.color,border:`1px solid ${ss.border}`,
                          textTransform:"capitalize" }}>
                          {don.status||"pending"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td style={{padding:"14px 20px"}}>
                        <div className="row-actions" style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                          {don.status!=="scheduled" && (
                            <button
                              onClick={() => handleStatus(don, "scheduled")}
                              disabled={isSaving}
                              style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                                borderRadius:8,background:"rgba(59,130,246,0.12)",
                                border:"1px solid rgba(59,130,246,0.25)",color:"#60a5fa",
                                cursor:isSaving?"not-allowed":"pointer",fontSize:11,fontWeight:700,
                                fontFamily:"'Inter',sans-serif",transition:"box-shadow 0.2s" }}
                              onMouseEnter={e=>!isSaving&&(e.currentTarget.style.boxShadow="0 0 15px rgba(59,130,246,0.4)")}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                              <CheckCircle size={12}/> Schedule
                            </button>
                          )}
                          {don.status!=="picked_up" && don.status!=="completed" && (
                            <button
                              onClick={() => handleStatus(don, "picked_up")}
                              disabled={isSaving}
                              style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                                borderRadius:8,background:"rgba(139,92,246,0.12)",
                                border:"1px solid rgba(139,92,246,0.25)",color:"#a78bfa",
                                cursor:isSaving?"not-allowed":"pointer",fontSize:11,fontWeight:700,
                                fontFamily:"'Inter',sans-serif",transition:"box-shadow 0.2s" }}
                              onMouseEnter={e=>!isSaving&&(e.currentTarget.style.boxShadow="0 0 15px rgba(139,92,246,0.4)")}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                              <CheckCircle size={12}/> Picked Up
                            </button>
                          )}
                          {don.status!=="completed" && (
                            <button
                              onClick={() => handleStatus(don, "completed")}
                              disabled={isSaving}
                              style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                                borderRadius:8,background:"rgba(16,185,129,0.12)",
                                border:"1px solid rgba(16,185,129,0.25)",color:"#34d399",
                                cursor:isSaving?"not-allowed":"pointer",fontSize:11,fontWeight:700,
                                fontFamily:"'Inter',sans-serif",transition:"box-shadow 0.2s" }}
                              onMouseEnter={e=>!isSaving&&(e.currentTarget.style.boxShadow="0 0 15px rgba(16,185,129,0.4)")}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                              <CheckCircle size={12}/> {isSaving ? "Saving..." : "Complete"}
                            </button>
                          )}
                          {don.status!=="cancelled" && (
                            <button
                              onClick={() => handleStatus(don, "cancelled")}
                              disabled={isSaving}
                              style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                                borderRadius:8,background:"rgba(239,68,68,0.12)",
                                border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",
                                cursor:isSaving?"not-allowed":"pointer",fontSize:11,fontWeight:700,
                                fontFamily:"'Inter',sans-serif",transition:"box-shadow 0.2s" }}
                              onMouseEnter={e=>!isSaving&&(e.currentTarget.style.boxShadow="0 0 15px rgba(239,68,68,0.4)")}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                              <XCircle size={12}/> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalDonations > PAGE_SIZE && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"16px 20px 20px", gap:12 }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
                Page {page} of {totalPages}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  style={{ padding:"8px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.75)", cursor:page===1?"not-allowed":"pointer", opacity:page===1?0.5:1 }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  style={{ padding:"8px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.75)", cursor:page>=totalPages?"not-allowed":"pointer", opacity:page>=totalPages?0.5:1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </motion.div>
  );
}
