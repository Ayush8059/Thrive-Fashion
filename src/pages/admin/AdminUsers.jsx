import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Ban, CheckCircle, AlertTriangle, Users, RotateCcw } from "lucide-react";
import { supabase } from "../../supabaseClient";

const GRAD = ["#6366f1,#8b5cf6","#8b5cf6,#ec4899","#06b6d4,#6366f1","#10b981,#06b6d4","#f59e0b,#ef4444"];

function Badge({ type }) {
  const styles = {
    active:  { bg:"rgba(16,185,129,0.15)",  color:"#34d399", border:"rgba(16,185,129,0.2)"  },
    blocked: { bg:"rgba(239,68,68,0.15)",   color:"#f87171", border:"rgba(239,68,68,0.2)"   },
    deleted: { bg:"rgba(148,163,184,0.15)", color:"#cbd5e1", border:"rgba(148,163,184,0.2)" },
    pending: { bg:"rgba(245,158,11,0.15)",  color:"#fbbf24", border:"rgba(245,158,11,0.2)"  },
    admin:   { bg:"rgba(99,102,241,0.15)",  color:"#818cf8", border:"rgba(99,102,241,0.2)"  },
    user:    { bg:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", border:"rgba(255,255,255,0.1)" },
  };
  const s = styles[type] || styles.user;
  return (
    <span style={{
      fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      textTransform:"uppercase", letterSpacing:"0.5px",
    }}>
      {type}
    </span>
  );
}

export default function AdminUsers() {
  const PAGE_SIZE = 10;
  const [search, setSearch]             = useState("");
  const [users, setUsers]               = useState([]);
  const [page, setPage]                 = useState(1);
  const [totalUsers, setTotalUsers]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchUsers(); }, [page]);
  useEffect(() => { setPage(1); }, [search]);

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: profiles, error: profileError, count } = await supabase
        .from("profiles")
        .select("id, full_name, email, is_admin, is_blocked, status, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (profileError) throw profileError;
      setTotalUsers(count || 0);

      const userIds = (profiles || []).map((profile) => profile.id).filter(Boolean);
      const { data: allItems } = userIds.length
        ? await supabase.from("items").select("user_id").in("user_id", userIds)
        : { data: [] };
      const countMap = {};
      (allItems||[]).forEach(item => { countMap[item.user_id] = (countMap[item.user_id]||0)+1; });

      setUsers((profiles||[]).map(p => ({
        ...p,
        total_items: countMap[p.id]||0,
        blocked: Boolean(p.is_blocked) || p.status==="blocked" || p.status==="deleted",
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "deleted",
        is_blocked: true,
      })
      .eq("id", id);
    if (!error) {
      setUsers(prev =>
        prev.map(u => (
          u.id === id
            ? { ...u, status: "deleted", is_blocked: true, blocked: true }
            : u
        ))
      );
    }
    setConfirmDelete(null);
  };

  const handleToggleBlock = async (id, isBlocked) => {
    const newStatus = isBlocked ? "active" : "blocked";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus, is_blocked: !isBlocked })
      .eq("id", id);
    if (!error) setUsers(prev => prev.map(u => u.id===id ? { ...u, status:newStatus, is_blocked:!isBlocked, blocked:!isBlocked } : u));
  };

  const handleRestore = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active", is_blocked: false })
      .eq("id", id);

    if (!error) {
      setUsers(prev =>
        prev.map(u => (
          u.id === id
            ? { ...u, status: "active", is_blocked: false, blocked: false }
            : u
        ))
      );
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:28, fontWeight:800, color:"white", margin:0,
          background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          User Management
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)", marginTop:4, fontSize:13 }}>
          View, block, revoke, or restore user access across the platform
        </p>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
              display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16,
              backdropFilter:"blur(4px)" }}>
            <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.85, opacity:0 }}
              style={{
                background:"rgba(10,15,46,0.98)", border:"1px solid rgba(239,68,68,0.3)",
                borderRadius:16, padding:28, maxWidth:360, width:"100%",
                boxShadow:"0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(239,68,68,0.15)",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:42, height:42, borderRadius:"50%",
                  background:"rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <AlertTriangle size={20} color="#f87171"/>
                </div>
                <div>
                  <div style={{ fontWeight:700, color:"white", fontSize:16 }}>Remove User Access</div>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>The account will be disabled and unable to sign in</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ flex:1, padding:"10px 0", borderRadius:10, background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.7)",
                    fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:13 }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  style={{ flex:1, padding:"10px 0", borderRadius:10,
                    background:"linear-gradient(135deg,#ef4444,#dc2626)",
                    border:"none", color:"white", fontWeight:700, cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:13,
                    boxShadow:"0 0 20px rgba(239,68,68,0.3)" }}>
                  Remove Access
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="space-card" style={{ padding:24 }}>

        {/* Search + count */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:20, alignItems:"center" }}>
          <div style={{ position:"relative", flex:"1 1 260px", maxWidth:380 }}>
            <Search size={16} color="rgba(255,255,255,0.3)"
              style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }}/>
            <input
              type="text" placeholder="Search by name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="space-input"
              style={{ paddingLeft:40 }}
            />
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 14px" }}>
            {filtered.length} user{filtered.length!==1?"s":""}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom:16, padding:"10px 14px", background:"rgba(239,68,68,0.12)",
            border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, color:"#f87171", fontSize:13 }}>
            Error: {error}
          </div>
        )}

        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:180 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",border:"2px solid transparent",
              borderTopColor:"#6366f1",borderRightColor:"#8b5cf6",animation:"spin-dash 1s linear infinite" }}/>
            <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 0", color:"rgba(255,255,255,0.3)" }}>
            <Users size={48} style={{ marginBottom:12, opacity:0.15 }}/>
            <p style={{ margin:0, fontSize:14 }}>{search ? `No users matching "${search}"` : "No users found"}</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="space-table" style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign:"left" }}>User</th>
                  <th style={{ textAlign:"left" }}>Email</th>
                  <th style={{ textAlign:"left" }}>Role</th>
                  <th style={{ textAlign:"left" }}>Status</th>
                  <th style={{ textAlign:"left" }}>Items</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:34, height:34, borderRadius:"50%", flexShrink:0,
                          background:`linear-gradient(135deg,${GRAD[idx%GRAD.length]})`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:13, fontWeight:700, color:"white",
                        }}>
                          {user.full_name?.charAt(0)?.toUpperCase()||"U"}
                        </div>
                        <span style={{ fontWeight:600, color:"white", fontSize:13 }}>
                          {user.full_name||"Unknown"}
                        </span>
                      </div>
                    </td>
                    <td style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>{user.email}</td>
                    <td>
                      <Badge type={user.is_admin ? "admin" : "user"} />
                    </td>
                    <td>
                      <Badge type={user.status === "deleted" ? "deleted" : user.blocked ? "blocked" : "active"} />
                    </td>
                    <td style={{ color:"rgba(255,255,255,0.6)", fontSize:13 }}>{user.total_items}</td>
                    <td>
                      <div className="row-actions" style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                        {!user.is_admin && (
                          <>
                            {user.status === "deleted" ? (
                              <button
                                onClick={() => handleRestore(user.id)}
                                title="Restore User"
                                style={{
                                  background:"rgba(16,185,129,0.15)",
                                  border:"1px solid rgba(16,185,129,0.3)",
                                  borderRadius:8,
                                  padding:"5px 12px",
                                  color:"#34d399",
                                  fontSize:11,
                                  fontWeight:700,
                                  cursor:"pointer",
                                  fontFamily:"'Inter',sans-serif",
                                  transition:"box-shadow 0.2s",
                                  display:"flex",
                                  alignItems:"center",
                                  gap:6,
                                }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 15px rgba(16,185,129,0.4)"}
                                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
                              >
                                <RotateCcw size={12}/> Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleBlock(user.id, user.blocked)}
                                  title={user.blocked ? "Unblock" : "Block"}
                                  style={{
                                    background: user.blocked ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                    border: `1px solid ${user.blocked ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                                    borderRadius:8, padding:"5px 12px",
                                    color: user.blocked ? "#34d399" : "#fbbf24",
                                    fontSize:11, fontWeight:700, cursor:"pointer",
                                    fontFamily:"'Inter',sans-serif",
                                    transition:"box-shadow 0.2s",
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.boxShadow=`0 0 15px ${user.blocked?"rgba(16,185,129,0.4)":"rgba(245,158,11,0.4)"}`}
                                  onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
                                >
                                  {user.blocked ? <><CheckCircle size={12} style={{display:"inline",marginRight:4}}/> Unblock</> : <><Ban size={12} style={{display:"inline",marginRight:4}}/>Block</>}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(user.id)}
                                  title="Remove Access"
                                  style={{
                                    background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                                    borderRadius:8, padding:"5px 8px", color:"#f87171",
                                    cursor:"pointer", display:"flex", alignItems:"center",
                                    transition:"box-shadow 0.2s",
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.boxShadow="0 0 15px rgba(239,68,68,0.4)"}
                                  onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalUsers > PAGE_SIZE && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, gap:12 }}>
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
      </div>
    </motion.div>
  );
}
