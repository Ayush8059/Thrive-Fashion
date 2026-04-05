import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Trash2, CheckCircle, XCircle, Search, Filter, AlertTriangle, Package } from "lucide-react";
import { supabase } from "../../supabaseClient";

const STATUS_FILTERS = ["All","active","sold","donated","removed","archived"];

const statusStyle = (status) => {
  const map = {
    active:  { bg:"rgba(16,185,129,0.15)", color:"#34d399", border:"rgba(16,185,129,0.2)" },
    sold:    { bg:"rgba(6,182,212,0.15)",  color:"#22d3ee", border:"rgba(6,182,212,0.2)"  },
    donated: { bg:"rgba(5,150,105,0.15)",  color:"#10b981", border:"rgba(5,150,105,0.2)"  },
    archived:{ bg:"rgba(107,114,128,0.15)", color:"#9ca3af", border:"rgba(107,114,128,0.2)" },
    removed: { bg:"rgba(239,68,68,0.15)",  color:"#f87171", border:"rgba(239,68,68,0.2)"  },
  };
  return map[status] || map.archived;
};

export default function AdminItems() {
  const PAGE_SIZE = 12;
  const [search, setSearch]               = useState("");
  const [items, setItems]                 = useState([]);
  const [page, setPage]                   = useState(1);
  const [totalItems, setTotalItems]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [statusFilter, setStatusFilter]   = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => { fetchItems(); }, [page]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const fetchItems = async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: itemsData, error: ie, count } = await supabase
        .from("items")
        .select("id,title,description,price,status,image_url,category,condition,created_at,user_id", { count: "exact" })
        .order("created_at",{ascending:false})
        .range(from, to);
      if (ie) throw ie;
      setTotalItems(count || 0);
      if (!itemsData?.length) { setItems([]); return; }

      const userIds = [...new Set(itemsData.map(i=>i.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from("profiles").select("id,full_name,email").in("id",userIds);
      const profileMap = Object.fromEntries((profiles||[]).map(p=>[p.id,p]));
      setItems(itemsData.map(item=>({ ...item, profile: profileMap[item.user_id]||null })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("items").delete().eq("id",id);
    if (!error) setItems(prev=>prev.filter(i=>i.id!==id));
    setConfirmDelete(null);
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus==="active" ? "archived" : "active";
    const { error } = await supabase.from("items").update({status:newStatus}).eq("id",id);
    if (!error) setItems(prev=>prev.map(i=>i.id===id?{...i,status:newStatus}:i));
  };

  const filtered = items.filter(i => {
    const s = i.title?.toLowerCase().includes(search.toLowerCase()) ||
               i.profile?.full_name?.toLowerCase().includes(search.toLowerCase());
    const f = statusFilter==="All" || i.status===statusFilter;
    return s && f;
  });
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:28, fontWeight:800, color:"white", margin:0,
          background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Marketplace Items
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)", marginTop:4, fontSize:13 }}>
          Review, archive, or remove user listings
        </p>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
              display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
              backdropFilter:"blur(4px)" }}>
            <motion.div initial={{scale:0.85}} animate={{scale:1}} exit={{scale:0.85}}
              style={{ background:"rgba(10,15,46,0.98)",border:"1px solid rgba(239,68,68,0.3)",
                borderRadius:16,padding:28,maxWidth:360,width:"100%",
                boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                <div style={{ width:42,height:42,borderRadius:"50%",
                  background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <AlertTriangle size={20} color="#f87171"/>
                </div>
                <div>
                  <div style={{ fontWeight:700,color:"white",fontSize:16 }}>Delete Item</div>
                  <div style={{ color:"rgba(255,255,255,0.4)",fontSize:12 }}>This cannot be undone</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:10,marginTop:20 }}>
                <button onClick={()=>setConfirmDelete(null)}
                  style={{ flex:1,padding:"10px 0",borderRadius:10,background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",
                    fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>
                  Cancel
                </button>
                <button onClick={()=>handleDelete(confirmDelete)}
                  style={{ flex:1,padding:"10px 0",borderRadius:10,
                    background:"linear-gradient(135deg,#ef4444,#dc2626)",
                    border:"none",color:"white",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif",boxShadow:"0 0 20px rgba(239,68,68,0.3)" }}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.75)",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              zIndex:200,
              backdropFilter:"blur(4px)",
              padding:24,
            }}
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ scale:0.9, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.9, opacity:0 }}
              style={{
                background:"rgba(10,15,46,0.98)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:18,
                overflow:"hidden",
                width:"100%",
                maxWidth:900,
                boxShadow:"0 30px 80px rgba(0,0,0,0.6)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display:"grid", gridTemplateColumns:"minmax(280px,1fr) minmax(320px,1fr)" }}>
                <div style={{ background:"rgba(255,255,255,0.03)" }}>
                  <img
                    src={previewItem.image_url}
                    alt={previewItem.title}
                    style={{ width:"100%", height:"100%", minHeight:420, objectFit:"cover" }}
                    onError={(event) => {
                      event.target.onerror = null;
                      event.target.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=1000&fit=crop";
                    }}
                  />
                </div>
                <div style={{ padding:24, display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                    <div>
                      <div style={{ fontSize:12, color:"#818cf8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                        {previewItem.category || "Fashion"}
                      </div>
                      <h2 style={{ margin:"6px 0 0", color:"white", fontSize:28, fontWeight:800 }}>
                        {previewItem.title}
                      </h2>
                    </div>
                    <span style={{ color:"#a5b4fc", fontSize:24, fontWeight:800 }}>
                      Rs.{previewItem.price}
                    </span>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <PreviewCard label="Seller" value={previewItem.profile?.full_name || previewItem.profile?.email || "Unknown"} />
                    <PreviewCard label="Status" value={previewItem.status || "Unknown"} />
                    <PreviewCard label="Condition" value={previewItem.condition || "Not specified"} />
                    <PreviewCard label="Created" value={new Date(previewItem.created_at).toLocaleDateString()} />
                  </div>

                  <div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      Description
                    </div>
                    <p style={{ margin:0, color:"rgba(255,255,255,0.72)", lineHeight:1.7, fontSize:14 }}>
                      {previewItem.description || "No description available for this item."}
                    </p>
                  </div>

                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"auto" }}>
                    <button
                      onClick={() => setPreviewItem(null)}
                      style={{
                        padding:"10px 16px",
                        borderRadius:10,
                        background:"rgba(255,255,255,0.06)",
                        border:"1px solid rgba(255,255,255,0.1)",
                        color:"rgba(255,255,255,0.8)",
                        fontWeight:600,
                        cursor:"pointer",
                        fontFamily:"'Inter',sans-serif",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="space-card" style={{padding:20}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 260px",maxWidth:380}}>
            <Search size={16} color="rgba(255,255,255,0.3)"
              style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}/>
            <input type="text" placeholder="Search items by title or seller…"
              value={search} onChange={e=>setSearch(e.target.value)}
              className="space-input" style={{paddingLeft:40}}/>
          </div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowFilterMenu(v=>!v)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
                background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10,color:"rgba(255,255,255,0.7)",cursor:"pointer",
                fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500,
                transition:"border-color 0.2s" }}>
              <Filter size={14}/>
              {statusFilter==="All"?"Filter Status":statusFilter}
            </button>
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                  style={{ position:"absolute",top:"calc(100% + 8px)",right:0,
                    background:"rgba(10,15,46,0.98)",border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:12,overflow:"hidden",zIndex:50,minWidth:160,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                  {STATUS_FILTERS.map(s=>(
                    <button key={s} onClick={()=>{setStatusFilter(s);setShowFilterMenu(false);}}
                      style={{ display:"block",width:"100%",textAlign:"left",padding:"10px 16px",
                        background: statusFilter===s?"rgba(99,102,241,0.15)":"transparent",
                        color: statusFilter===s?"#818cf8":"rgba(255,255,255,0.65)",
                        border:"none",cursor:"pointer",fontSize:13,
                        fontFamily:"'Inter',sans-serif",fontWeight:statusFilter===s?600:400,
                        transition:"background 0.15s",
                        textTransform:"capitalize" }}>
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
            {filtered.length} item{filtered.length!==1?"s":""}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding:"10px 14px",background:"rgba(239,68,68,0.12)",
          border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,color:"#f87171",fontSize:13 }}>
          Error: {error}
        </div>
      )}

      {/* Items grid */}
      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200}}>
          <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid transparent",
            borderTopColor:"#6366f1",borderRightColor:"#8b5cf6",animation:"spin-dash 1s linear infinite"}}/>
          <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.3)"}}>
          <Package size={48} style={{marginBottom:12,opacity:0.15}}/>
          <p style={{margin:0,fontSize:14}}>
            {search||statusFilter!=="All" ? "No items match your filters" : "No items found"}
          </p>
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:18}}>
            {filtered.map(item => {
              const ss = statusStyle(item.status);
              const isActive = item.status==="active";
              return (
                <motion.div key={item.id}
                  whileHover={{ y:-6, boxShadow:"0 20px 50px rgba(99,102,241,0.2)" }}
                  transition={{ duration:0.2 }}
                  className="space-card"
                  style={{ overflow:"hidden", display:"flex", flexDirection:"column" }}>

                {/* Image */}
                <div style={{ position:"relative", aspectRatio:"4/3", overflow:"hidden",
                  background:"rgba(255,255,255,0.03)" }}>
                  <img src={item.image_url} alt={item.title}
                    style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s" }}
                    onError={e=>{e.target.onerror=null;e.target.src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop";}}
                    onMouseEnter={e=>e.target.style.transform="scale(1.08)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}
                  />
                  {/* Status badge */}
                  <div style={{ position:"absolute",top:10,left:10 }}>
                    <span style={{ fontSize:10,padding:"3px 10px",borderRadius:12,fontWeight:700,
                      background:ss.bg,color:ss.color,border:`1px solid ${ss.border}`,textTransform:"capitalize" }}>
                      {item.status||"pending"}
                    </span>
                  </div>
                  {/* Category badge */}
                  {item.category && (
                    <div style={{ position:"absolute",top:10,right:10 }}>
                      <span style={{ fontSize:10,padding:"3px 10px",borderRadius:12,fontWeight:600,
                        background:"rgba(99,102,241,0.2)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.3)" }}>
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding:16, flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                    <h3 style={{ margin:0,fontSize:14,fontWeight:700,color:"white",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>
                      {item.title}
                    </h3>
                    <span style={{ fontSize:14,fontWeight:700,color:"#a5b4fc",marginLeft:8,flexShrink:0 }}>
                      Rs.{item.price}
                    </span>
                  </div>
                  <p style={{ margin:"0 0 12px",fontSize:12,color:"rgba(255,255,255,0.4)" }}>
                    By {item.profile?.full_name||"Unknown"}
                  </p>

                  {/* Action buttons */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:"auto",
                    paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      onClick={() => setPreviewItem(item)}
                      style={{ display:"flex",alignItems:"center",justifyContent:"center",
                        padding:"7px 0",borderRadius:8,
                        background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",
                        color:"#22d3ee",transition:"box-shadow 0.2s",cursor:"pointer",
                        textDecoration:"none" }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 15px rgba(6,182,212,0.3)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <Eye size={14}/>
                    </button>
                    <button onClick={()=>handleStatusChange(item.id,item.status)}
                      style={{ display:"flex",alignItems:"center",justifyContent:"center",
                        padding:"7px 0",borderRadius:8,
                        background:isActive?"rgba(107,114,128,0.12)":"rgba(16,185,129,0.1)",
                        border:`1px solid ${isActive?"rgba(107,114,128,0.2)":"rgba(16,185,129,0.2)"}`,
                        color:isActive?"#d1d5db":"#34d399",
                        cursor:"pointer",transition:"box-shadow 0.2s" }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 15px ${isActive?"rgba(107,114,128,0.3)":"rgba(16,185,129,0.3)"}`}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      {isActive ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                    </button>
                    <button onClick={()=>setConfirmDelete(item.id)}
                      style={{ display:"flex",alignItems:"center",justifyContent:"center",
                        padding:"7px 0",borderRadius:8,
                        background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
                        color:"#f87171",cursor:"pointer",transition:"box-shadow 0.2s" }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 15px rgba(239,68,68,0.3)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
                </motion.div>
              );
            })}
          </div>
          {totalItems > PAGE_SIZE && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:18, gap:12 }}>
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
    </motion.div>
  );
}

function PreviewCard({ label, value }) {
  return (
    <div
      style={{
        border:"1px solid rgba(255,255,255,0.08)",
        background:"rgba(255,255,255,0.04)",
        borderRadius:12,
        padding:"12px 14px",
      }}
    >
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
        {label}
      </div>
      <div style={{ color:"white", fontSize:14, fontWeight:600 }}>
        {value}
      </div>
    </div>
  );
}
