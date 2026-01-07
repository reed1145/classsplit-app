import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Plus, ArrowLeft, Check, X, Receipt, TrendingUp, ClipboardList, Clock, BarChart3, AlertCircle, Edit2, Trash2, MessageCircle, Sparkles } from 'lucide-react';

export default function ClassSplit() {
  const [view, setView] = useState('home');
  const [groups, setGroups] = useState([]);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('expenses');
  const [gName, setGName] = useState('');
  const [mName, setMName] = useState('');
  const [eAmt, setEAmt] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [ePaid, setEPaid] = useState('');
  const [tName, setTName] = useState('');
  const [tHrs, setTHrs] = useState('');
  const [tAssign, setTAssign] = useState([]);
  const [tDue, setTDue] = useState('');
  const [editE, setEditE] = useState(null);
  const [editT, setEditT] = useState(null);
  const [viewComments, setViewComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem('cs');
    if (s) setGroups(JSON.parse(s));
  }, []);

  useEffect(() => { localStorage.setItem('cs', JSON.stringify(groups)); }, [groups]);

  const addG = () => {
    if (!gName.trim()) return;
    setGroups([...groups, { id: Date.now(), name: gName, members: [], expenses: [], tasks: [] }]);
    setGName(''); setView('home');
  };

  const addM = (gid) => {
    if (!mName.trim()) return;
    setGroups(groups.map(g => g.id === gid ? { ...g, members: [...g.members, { id: Date.now(), name: mName, bal: 0, hrs: 0 }] } : g));
    setMName('');
  };

  const addE = () => {
    if (!eAmt || !eDesc || !ePaid) return;
    const a = parseFloat(eAmt);
    const g = groups.find(x => x.id === sel.id);
    const s = a / g.members.length;
    setGroups(groups.map(x => {
      if (x.id === sel.id) {
        const m = x.members.map(y => y.name === ePaid ? { ...y, bal: y.bal + a - s } : { ...y, bal: y.bal - s });
        return { ...x, expenses: [...x.expenses, { id: Date.now(), desc: eDesc, amt: a, by: ePaid, settled: false }], members: m };
      }
      return x;
    }));
    setEAmt(''); setEDesc(''); setEPaid(''); setView('group');
  };

  const addT = () => {
    if (!tName || !tHrs || tAssign.length === 0) return;
    const h = parseFloat(tHrs);
    const hp = h / tAssign.length;
    setGroups(groups.map(g => {
      if (g.id === sel.id) {
        const m = g.members.map(x => tAssign.includes(x.name) ? { ...x, hrs: x.hrs + hp } : x);
        return { ...g, tasks: [...g.tasks, { id: Date.now(), name: tName, hrs: h, to: tAssign, done: false, due: tDue || null, comments: [] }], members: m };
      }
      return g;
    }));
    setTName(''); setTHrs(''); setTAssign([]); setTDue(''); setView('group');
  };

  const togT = (gid, tid) => {
    setGroups(groups.map(g => g.id === gid ? { ...g, tasks: g.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) } : g));
  };

  const settleE = (gid, eid) => {
    setGroups(groups.map(g => g.id === gid ? { ...g, expenses: g.expenses.map(e => e.id === eid ? { ...e, settled: true } : e) } : g));
  };

  const delG = (gid) => { setGroups(groups.filter(g => g.id !== gid)); setView('home'); };

  const delM = (gid, mid) => {
    setGroups(groups.map(g => {
      if (g.id === gid) {
        const m = g.members.find(x => x.id === mid);
        if (m.bal !== 0 || m.hrs !== 0) { alert('Cannot remove member with pending items'); return g; }
        return { ...g, members: g.members.filter(x => x.id !== mid) };
      }
      return g;
    }));
  };

  const delE = (gid, eid) => {
    setGroups(groups.map(g => {
      if (g.id === gid) {
        const e = g.expenses.find(x => x.id === eid);
        const s = e.amt / g.members.length;
        const m = g.members.map(x => x.name === e.by ? { ...x, bal: x.bal - e.amt + s } : { ...x, bal: x.bal + s });
        return { ...g, expenses: g.expenses.filter(x => x.id !== eid), members: m };
      }
      return g;
    }));
  };
  const delT = (gid, tid) => {
    setGroups(groups.map(g => {
      if (g.id === gid) {
        const t = g.tasks.find(x => x.id === tid);
        const h = t.hrs / t.to.length;
        const m = g.members.map(x => t.to.includes(x.name) ? { ...x, hrs: x.hrs - h } : x);
        return { ...g, tasks: g.tasks.filter(x => x.id !== tid), members: m };
      }
      return g;
    }));
  };

  const startEditE = (e) => {
    setEditE(e);
    setEDesc(e.desc);
    setEAmt(e.amt.toString());
    setEPaid(e.by);
    setView('addExpense');
  };

  const startEditT = (t) => {
    setEditT(t);
    setTName(t.name);
    setTHrs(t.hrs.toString());
    setTAssign(t.to);
    setTDue(t.due || '');
    setView('addTask');
  };

  const updateE = () => {
    if (!eAmt || !eDesc || !ePaid || !editE) return;
    const a = parseFloat(eAmt);
    setGroups(groups.map(g => {
      if (g.id === sel.id) {
        const old = g.expenses.find(e => e.id === editE.id);
        const os = old.amt / g.members.length;
        const ns = a / g.members.length;
        const m = g.members.map(x => {
          let b = x.bal;
          if (x.name === old.by) b = b - old.amt + os;
          else b = b + os;
          if (x.name === ePaid) b = b + a - ns;
          else b = b - ns;
          return { ...x, bal: b };
        });
        return { ...g, expenses: g.expenses.map(e => e.id === editE.id ? { ...e, desc: eDesc, amt: a, by: ePaid } : e), members: m };
      }
      return g;
    }));
    setEAmt(''); setEDesc(''); setEPaid(''); setEditE(null); setView('group');
  };

  const updateT = () => {
    if (!tName || !tHrs || tAssign.length === 0 || !editT) return;
    const h = parseFloat(tHrs);
    const hp = h / tAssign.length;
    setGroups(groups.map(g => {
      if (g.id === sel.id) {
        const old = g.tasks.find(t => t.id === editT.id);
        const oh = old.hrs / old.to.length;
        const m = g.members.map(x => {
          let hrs = x.hrs;
          if (old.to.includes(x.name)) hrs -= oh;
          if (tAssign.includes(x.name)) hrs += hp;
          return { ...x, hrs };
        });
        return { ...g, tasks: g.tasks.map(t => t.id === editT.id ? { ...t, name: tName, hrs: h, to: tAssign, due: tDue || null, comments: t.comments || [] } : t), members: m };
      }
      return g;
    }));
    setTName(''); setTHrs(''); setTAssign([]); setTDue(''); setEditT(null); setView('group');
  };

  const addComment = (gid, tid) => {
    if (!newComment.trim()) return;
    setGroups(groups.map(g => {
      if (g.id === gid) {
        return {
          ...g,
          tasks: g.tasks.map(t => t.id === tid ? { ...t, comments: [...(t.comments || []), { id: Date.now(), text: newComment, date: new Date().toISOString() }] } : t)
        };
      }
      return g;
    }));
    setNewComment('');
  };

  const delComment = (gid, tid, cid) => {
    setGroups(groups.map(g => {
      if (g.id === gid) {
        return {
          ...g,
          tasks: g.tasks.map(t => t.id === tid ? { ...t, comments: (t.comments || []).filter(c => c.id !== cid) } : t)
        };
      }
      return g;
    }));
  };

  const scanAssignment = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Break down this assignment into specific tasks with estimated hours. Respond ONLY with valid JSON (no markdown):
            
Assignment: ${aiInput}

Format:
{"tasks": [{"name": "Task name", "hours": 2.5}]}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setAiTasks(parsed.tasks || []);
      }
    } catch (err) {
      console.error(err);
      alert('AI scan failed. Try again!');
    } finally {
      setAiLoading(false);
    }
  };

  const addAiTask = (task) => {
    setTName(task.name);
    setTHrs(task.hours.toString());
    setAiTasks(aiTasks.filter(t => t !== task));
    setShowAI(false);
    setView('addTask');
  };

  const calcF = (g) => {
    if (!g.members || g.members.length === 0) return 100;
    const tot = g.members.reduce((s, m) => s + (m.hrs || 0), 0);
    if (tot === 0) return 100;
    const avg = tot / g.members.length;
    const dev = g.members.map(m => Math.abs((m.hrs || 0) - avg));
    const ad = dev.reduce((s, d) => s + d, 0) / g.members.length;
    return Math.round(Math.max(0, 100 - (ad / avg * 100)));
  };

  const getOwes = (g) => {
    const out = [];
    const debtors = g.members.filter(m => m.bal < -0.01).map(m => ({ ...m })).sort((a, b) => a.bal - b.bal);
    const creditors = g.members.filter(m => m.bal > 0.01).map(m => ({ ...m })).sort((a, b) => b.bal - a.bal);
    debtors.forEach(d => {
      let rem = Math.abs(d.bal);
      creditors.forEach(c => {
        if (rem > 0.01 && c.bal > 0.01) {
          const amt = Math.min(rem, c.bal);
          out.push({ from: d.name, to: c.name, amt });
          rem -= amt;
          c.bal -= amt;
        }
      });
    });
    return out;
  };
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ClassSplit Pro</h1>
            <p className="text-gray-600">Split expenses and tasks fairly</p>
          </div>
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No groups yet</h3>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {groups.map(g => {
                const f = calcF(g);
                return (
                  <div key={g.id} onClick={() => { setSel(g); setView('group'); }} className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl">
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">{g.name}</h3>
                        <p className="text-sm text-gray-500">{g.members.length} members • {g.expenses.length} expenses • {g.tasks.length} tasks</p>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">RM {g.expenses.reduce((s, e) => s + e.amt, 0).toFixed(2)}</div>
                    </div>
                    {g.tasks.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${f >= 70 ? 'bg-green-500' : f >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: f + '%' }} />
                        </div>
                        <span className="text-xs font-semibold">{f}% fair</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => setView('createGroup')} className="w-full bg-indigo-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700">
            <Plus className="w-5 h-5" />Create New Group
          </button>
        </div>
      </div>
    );
  }

  if (view === 'createGroup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setView('home')} className="mb-6 flex items-center gap-2 text-indigo-600">
            <ArrowLeft className="w-5 h-5" />Back
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
            <input type="text" value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Group name" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <button onClick={addG} disabled={!gName.trim()} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold disabled:opacity-50">Create</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'addMember') {
    const g = groups.find(x => x.id === sel.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setView('group')} className="mb-6 flex items-center gap-2 text-indigo-600"><ArrowLeft className="w-5 h-5" />Back</button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Manage Members</h2>
            {g.members.length > 0 && <div className="mb-6">{g.members.map(m => <div key={m.id} className="p-3 bg-gray-50 rounded-lg mb-2 flex justify-between items-center"><span>{m.name}</span><button onClick={() => delM(g.id, m.id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button></div>)}</div>}
            <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Member name" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <button onClick={() => addM(g.id)} disabled={!mName.trim()} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold disabled:opacity-50">Add</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'addExpense') {
    const g = groups.find(x => x.id === sel.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setView('group'); setEditE(null); setEAmt(''); setEDesc(''); setEPaid(''); }} className="mb-6 flex items-center gap-2 text-indigo-600"><ArrowLeft className="w-5 h-5" />Back</button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{editE ? 'Edit Expense' : 'Add Expense'}</h2>
            <input type="text" value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Description" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <input type="number" step="0.01" value={eAmt} onChange={(e) => setEAmt(e.target.value)} placeholder="Amount" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <select value={ePaid} onChange={(e) => setEPaid(e.target.value)} className="w-full px-4 py-3 border rounded-lg mb-4">
              <option value="">Paid by</option>
              {g.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            {eAmt && g.members.length > 0 && <div className="bg-indigo-50 rounded-lg p-4 mb-4"><div className="text-sm text-gray-600">Split per person</div><div className="text-2xl font-bold text-indigo-600">RM {(parseFloat(eAmt) / g.members.length).toFixed(2)}</div></div>}
            <button onClick={editE ? updateE : addE} disabled={!eAmt || !eDesc || !ePaid} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold disabled:opacity-50">{editE ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'addTask') {
    const g = groups.find(x => x.id === sel.id);
    const tog = (n) => { if (tAssign.includes(n)) setTAssign(tAssign.filter(a => a !== n)); else setTAssign([...tAssign, n]); };
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => { setView('group'); setEditT(null); setTName(''); setTHrs(''); setTAssign([]); setTDue(''); }} className="mb-6 flex items-center gap-2 text-indigo-600"><ArrowLeft className="w-5 h-5" />Back</button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{editT ? 'Edit Task' : 'Add Task'}</h2>
            <input type="text" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Task name" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <input type="number" step="0.5" value={tHrs} onChange={(e) => setTHrs(e.target.value)} placeholder="Hours" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <div className="mb-4"><label className="block text-sm font-medium mb-2">Deadline (Optional)</label><input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} className="w-full px-4 py-3 border rounded-lg" /></div>
            <div className="mb-4"><label className="block text-sm font-medium mb-2">Assign to</label><div className="space-y-2">{g.members.map(m => <button key={m.id} onClick={() => tog(m.name)} className={`w-full p-3 rounded-lg ${tAssign.includes(m.name) ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{m.name}</button>)}</div></div>
            {tHrs && tAssign.length > 0 && <div className="bg-indigo-50 rounded-lg p-4 mb-4"><div className="text-sm">Hours per person</div><div className="text-2xl font-bold text-indigo-600">{(parseFloat(tHrs) / tAssign.length).toFixed(1)}h each</div></div>}
            <button onClick={editT ? updateT : addT} disabled={!tName || !tHrs || tAssign.length === 0} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold disabled:opacity-50">{editT ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </div>
    );
  }
  if (view === 'group' && sel) {
    const g = groups.find(x => x.id === sel.id);
    if (!g) { setView('home'); return null; }
    const f = calcF(g);
    const tot = g.members.reduce((s, m) => s + (m.hrs || 0), 0);
    const avg = g.members.length > 0 ? tot / g.members.length : 0;
    const owes = getOwes(g);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView('home')} className="mb-6 flex items-center gap-2 text-indigo-600"><ArrowLeft className="w-5 h-5" />Back</button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">{g.name}</h2>
              <button onClick={() => delG(g.id)} className="text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setTab('expenses')} className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${tab === 'expenses' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}><DollarSign className="w-5 h-5" />Expenses</button>
              <button onClick={() => setTab('tasks')} className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${tab === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}><ClipboardList className="w-5 h-5" />Tasks</button>
            </div>
            {tab === 'expenses' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-indigo-600">RM {g.expenses.reduce((s, e) => s + e.amt, 0).toFixed(2)}</div><div className="text-sm">Total</div></div>
                  <div className="bg-green-50 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-green-600">{g.expenses.filter(e => e.settled).length}/{g.expenses.length}</div><div className="text-sm">Settled</div></div>
                </div>
                <div className="space-y-2 mb-6">
                  <button onClick={() => setView('addMember')} className="w-full bg-gray-100 rounded-lg py-3 font-semibold flex items-center justify-center gap-2"><Users className="w-5 h-5" />Members ({g.members.length})</button>
                  <button onClick={() => setView('addExpense')} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2"><Plus className="w-5 h-5" />Add Expense</button>
                </div>
                {g.members.length > 0 && <div className="mb-6"><h3 className="font-semibold mb-3">Balances</h3>{g.members.map(m => <div key={m.id} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2"><span>{m.name}</span><span className={m.bal >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{m.bal >= 0 ? '+' : ''}RM {m.bal.toFixed(2)}</span></div>)}</div>}
                {owes.length > 0 && <div className="mb-6"><h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Who Owes Who</h3><div className="space-y-2">{owes.map((d, i) => <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex justify-between items-center"><div><span className="font-semibold text-gray-800">{d.from}</span><span className="text-gray-600"> owes </span><span className="font-semibold text-gray-800">{d.to}</span></div><div className="text-xl font-bold text-blue-600">RM {d.amt.toFixed(2)}</div></div></div>)}</div></div>}
                {g.expenses.length > 0 && <div><h3 className="font-semibold mb-3">Expenses</h3>{g.expenses.slice().reverse().map(e => <div key={e.id} className={`p-4 rounded-lg mb-3 ${e.settled ? 'bg-green-50' : 'bg-gray-50'}`}><div className="flex justify-between mb-2"><div><div className="font-semibold">{e.desc}</div><div className="text-sm text-gray-500">Paid by {e.by}</div></div><div className="flex items-start gap-2"><div className="text-right"><div className="font-bold">RM {e.amt.toFixed(2)}</div><div className="text-xs text-gray-500">RM {(e.amt / g.members.length).toFixed(2)} each</div></div><button onClick={() => startEditE(e)} className="p-1 text-blue-600 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button><button onClick={() => delE(g.id, e.id)} className="p-1 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div></div>{!e.settled && <button onClick={() => settleE(g.id, e.id)} className="w-full mt-2 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2"><Check className="w-4 h-4" />Settle</button>}</div>)}</div>}
              </>
            )}
            {tab === 'tasks' && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-purple-600">{tot.toFixed(1)}h</div><div className="text-sm">Total</div></div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-blue-600">{avg.toFixed(1)}h</div><div className="text-sm">Avg</div></div>
                  <div className="bg-green-50 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-green-600">{f}%</div><div className="text-sm">Fair</div></div>
                </div>
                {f < 70 && g.tasks.length > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3"><AlertCircle className="w-5 h-5 text-yellow-600" /><div><p className="text-sm font-semibold text-yellow-800">Imbalance detected</p></div></div>}
                <button onClick={() => setView('addTask')} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 mb-6"><Plus className="w-5 h-5" />Add Task</button>
                {g.members.length > 0 && <div className="mb-6"><h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5" />Work Distribution</h3>{g.members.map(m => { const p = tot > 0 ? (m.hrs / tot * 100) : 0; const d = m.hrs - avg; return <div key={m.id} className="p-3 bg-gray-50 rounded-lg mb-3"><div className="flex justify-between mb-2"><span>{m.name}</span><div><span className="font-bold">{m.hrs.toFixed(1)}h</span><span className={`ml-2 text-xs ${d > 1 ? 'text-red-600' : d < -1 ? 'text-green-600' : 'text-gray-500'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)}h</span></div></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: p + '%' }} /></div></div>; })}</div>}
                {g.tasks.length > 0 && <div><h3 className="font-semibold mb-3">Tasks</h3>{g.tasks.slice().reverse().map(t => { const now = new Date(); const due = t.due ? new Date(t.due) : null; const overdue = due && due < now && !t.done; const soon = due && !overdue && !t.done && (due - now) / (1000*60*60*24) <= 3; const commentCount = (t.comments || []).length; return <div key={t.id} className={`p-4 rounded-lg mb-3 border-2 ${t.done ? 'bg-green-50 border-green-200' : overdue ? 'bg-red-50 border-red-300' : soon ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}><div className="flex justify-between"><div className="flex-1"><div className="font-semibold">{t.name}</div><div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.hrs}h total</span><span>Split: {t.to.join(', ')} ({(t.hrs / t.to.length).toFixed(1)}h each)</span>{t.due && <span className={`font-semibold ${overdue ? 'text-red-600' : soon ? 'text-yellow-600' : 'text-gray-600'}`}>📅 Due: {new Date(t.due).toLocaleDateString()}{overdue && ' (OVERDUE!)'}{soon && ' (Soon!)'}</span>}</div></div><div className="flex items-start gap-2"><button onClick={() => setViewComments(t)} className="p-1 text-purple-600 hover:text-purple-700 relative"><MessageCircle className="w-4 h-4" />{commentCount > 0 && <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{commentCount}</span>}</button><button onClick={() => startEditT(t)} className="p-1 text-blue-600 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button><button onClick={() => delT(g.id, t.id)} className="p-1 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button><button onClick={() => togT(g.id, t.id)} className={`p-2 rounded-lg ${t.done ? 'bg-green-600 text-white' : 'bg-gray-200'}`}><Check className="w-5 h-5" /></button></div></div></div>; })}</div>}
              </>
            )}
          </div>
        </div>
        {viewComments && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewComments(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">💬 Comments: {viewComments.name}</h3>
                <button onClick={() => setViewComments(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-3 mb-4">
                {(viewComments.comments || []).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet. Start the conversation!</p>
                ) : (
                  (viewComments.comments || []).map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gray-500">{new Date(c.date).toLocaleString()}</span>
                        <button onClick={() => delComment(g.id, viewComments.id, c.id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="text-gray-800">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2 border rounded-lg" onKeyPress={(e) => e.key === 'Enter' && addComment(g.id, viewComments.id)} />
                <button onClick={() => addComment(g.id, viewComments.id)} disabled={!newComment.trim()} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}
