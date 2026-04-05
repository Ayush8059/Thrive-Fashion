import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, Users, HeartHandshake, Package } from "lucide-react";
import { supabase } from "../../supabaseClient";

const CATEGORY_COLORS = {
  Outerwear: "#6366f1", Dresses: "#ec4899", Shoes: "#06b6d4",
  Pants: "#8b5cf6", Tops: "#10b981", Other: "#f59e0b",
};

export default function AdminReports() {
  const [stats, setStats]       = useState({ users:0, donations:0, items:0 });
  const [categories, setCategories] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { count: userCount },
        { count: donationCount },
        { data: itemsData },
        { data: recentActivity },
      ] = await Promise.all([
        supabase.from("profiles").select("*",{count:"exact",head:true}),
        supabase.from("donations").select("*",{count:"exact",head:true}),
        supabase.from("items").select("id,category,status,title,created_at").order("created_at",{ascending:false}),
        supabase.from("items").select("id,title,status,created_at").order("created_at",{ascending:false}).limit(5),
      ]);

      setStats({ users:userCount||0, donations:donationCount||0, items:(itemsData||[]).length });

      // Group by category
      const catMap = {};
      (itemsData||[]).forEach(i => {
        const cat = i.category||"Other";
        catMap[cat] = (catMap[cat]||0) + 1;
      });
      const total = Object.values(catMap).reduce((a,b)=>a+b,1);
      setCategories(
        Object.entries(catMap)
          .sort((a,b)=>b[1]-a[1])
          .slice(0,6)
          .map(([name,count])=>({name,count,pct:Math.round(count/total*100)}))
      );

      setActivity(recentActivity||[]);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Metric","Value"],
      ["Total Users",stats.users],
      ["Total Donations",stats.donations],
      ["Total Items",stats.items],
      ...categories.map(c=>[`Items - ${c.name}`,c.count]),
    ].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "thrive_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now()-new Date(dateStr))/1000);
    if (diff<60)    return `${diff}s ago`;
    if (diff<3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff<86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const METRIC_CARDS = [
    { title:"New Users",       value:stats.users,     icon:<Users size={20}/>,         color:"#818cf8", glow:"rgba(99,102,241,0.3)"  },
    { title:"Total Donations", value:stats.donations, icon:<HeartHandshake size={20}/>,color:"#f472b6", glow:"rgba(236,72,153,0.3)"  },
    { title:"Total Items",     value:stats.items,     icon:<Package size={20}/>,       color:"#22d3ee", glow:"rgba(6,182,212,0.3)"   },
  ];

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:"2px solid transparent",
        borderTopColor:"#6366f1",borderRightColor:"#8b5cf6",animation:"spin-dash 1s linear infinite"}}/>
      <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{ fontSize:28,fontWeight:800,color:"white",margin:0,
            background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Analytics & Reports
          </h1>
          <p style={{ color:"rgba(255,255,255,0.4)",marginTop:4,fontSize:13 }}>
            Platform performance metrics and category breakdown
          </p>
        </div>
        <button onClick={handleExport}
          style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            border:"none",borderRadius:10,color:"white",
            fontWeight:700,fontSize:13,cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
            boxShadow:"0 0 20px rgba(99,102,241,0.3)",
            transition:"transform 0.2s,box-shadow 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow="0 0 30px rgba(99,102,241,0.5)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 0 20px rgba(99,102,241,0.3)";}}>
          <Download size={15}/> Export CSV
        </button>
      </div>

      {/* Metric cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:18}}>
        {METRIC_CARDS.map((card,i)=>(
          <motion.div key={card.title}
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
            className={`space-card float-card-d${i}`}
            style={{padding:22,cursor:"default"}}
            whileHover={{y:-6,boxShadow:`0 0 40px ${card.glow}`,transition:{duration:0.2}}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{ width:42,height:42,borderRadius:10,
                background:`${card.glow.replace("0.3","0.15")}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:card.color,border:`1px solid ${card.glow.replace("0.3","0.25")}` }}>
                {card.icon}
              </div>
              <TrendingUp size={14} color="rgba(255,255,255,0.2)"/>
            </div>
            <div style={{ fontSize:11,textTransform:"uppercase",letterSpacing:"0.8px",
              color:"rgba(255,255,255,0.45)",fontWeight:600,marginBottom:4 }}>
              {card.title}
            </div>
            <div style={{ fontSize:30,fontWeight:700,color:card.color,textShadow:`0 0 30px ${card.glow}` }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom: bar chart + activity */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* Bar chart */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="space-card" style={{padding:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <BarChart3 size={18} color="#818cf8"/>
            <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"white"}}>Items by Category</h3>
          </div>

          {categories.length===0 ? (
            <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>
              No items data available
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {categories.map((cat,i)=>{
                const col = CATEGORY_COLORS[cat.name]||"#6366f1";
                return (
                  <div key={cat.name}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:500}}>{cat.name}</span>
                      <span style={{fontSize:13,fontWeight:700,color:col}}>{cat.count}</span>
                    </div>
                    <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:20,overflow:"hidden"}}>
                      <motion.div
                        initial={{width:0}}
                        animate={{width:`${cat.pct}%`}}
                        transition={{delay:0.4+i*0.08,duration:0.7,ease:"easeOut"}}
                        style={{
                          height:"100%",borderRadius:20,
                          background:`linear-gradient(90deg,${col},${col}88)`,
                          boxShadow:`0 0 10px ${col}60`,
                        }}
                      />
                    </div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3,textAlign:"right"}}>
                      {cat.pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
          className="space-card" style={{padding:24}}>
          <h3 style={{margin:"0 0 20px",fontSize:15,fontWeight:700,color:"white"}}>
            Recent Activity
          </h3>

          {activity.length===0 ? (
            <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.3)",fontSize:13}}>
              No recent activity
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {activity.map((item,i)=>(
                <div key={item.id} style={{
                  display:"flex",alignItems:"flex-start",gap:12,
                  paddingBottom:16,marginBottom:16,
                  borderBottom: i<activity.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  {/* Timeline dot */}
                  <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",marginTop:4}}>
                    <div style={{ width:10,height:10,borderRadius:"50%",
                      background:`linear-gradient(135deg,#6366f1,#8b5cf6)`,
                      boxShadow:"0 0 8px rgba(99,102,241,0.6)" }}/>
                    {i<activity.length-1 && (
                      <div style={{width:1,height:24,background:"rgba(99,102,241,0.15)",marginTop:4}}/>
                    )}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"white",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {item.title}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                      <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:600,textTransform:"capitalize",
                        ...(item.status==="active"
                          ?{background:"rgba(16,185,129,0.15)",color:"#34d399"}
                          :{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}) }}>
                        {item.status}
                      </span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}