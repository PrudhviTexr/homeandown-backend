import React, { useEffect, useState } from 'react';
import { RecordsApi, AdminApi } from '@/services/pyApi';
import { Property, DatabaseUser } from '@/types/database';

interface ViewingStatusPanelProps {
  propertyId?: number;
  compact?: boolean;
}

const ViewingStatusPanel: React.FC<ViewingStatusPanelProps> = ({ propertyId, compact }) => {
  const [viewings, setViewings] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [loading, setLoading] = useState(false);
  const statuses = ['scheduled','completed','cancelled','no_show'];

  const load = async () => {
    setLoading(true);
    try {
      const [v, props, usrs] = await Promise.all([
        RecordsApi.listViewings(),
        AdminApi.properties(),
        AdminApi.users()
      ]);
      
      setProperties(props || []);
      setUsers(usrs || []);

      const filtered = propertyId 
        ? (v || []).filter((x:any)=> String(x.property_id) === String(propertyId)) 
        : (v || []);
      
      setViewings(filtered.slice(0, 25));
    } catch (err: any) {
      // If viewings endpoint not present return empty silently (dev)
      if (err && err.message && err.message.includes('Not Found')) {
        setViewings([]);
      } else {
        setViewings([]);
      }
    }
    setLoading(false);
  };

  // Avoid multiple rapid calls in React StrictMode (dev double-invoke)
  useEffect(()=>{
    let mounted = true;
    const t = setTimeout(()=>{ if (mounted) load(); }, 10);
    return ()=>{ mounted = false; clearTimeout(t); };
  }, [propertyId]);

  const update = async (id:number, status:string) => {
    try {
      await fetch(`/api/bookings/${id}/status`, { method:'POST', headers:{ 'Content-Type':'application/json','X-API-Key': (import.meta as any).env?.PYTHON_API_KEY || '' }, body: JSON.stringify({ status }) });
      await load();
    } catch {}
  };
  
  const getPropertyName = (id: string) => {
    const prop = properties.find(p => p.id === id);
    return prop ? prop.title : `Prop ID: ${id.substring(0,8)}...`;
  };

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? `${user.first_name} ${user.last_name}` : `User ID: ${id.substring(0,8)}...`;
  };

  return (
    <div className={`bg-white border rounded-lg ${compact ? 'p-3' : 'p-5'} space-y-3`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">Viewings</h4>
        <button onClick={load} className="text-xs text-blue-600 hover:underline">Refresh</button>
      </div>
      {loading && <p className="text-xs text-gray-500">Loading...</p>}
      {!loading && !viewings.length && <p className="text-xs text-gray-500">No viewings</p>}
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {viewings.map(v => (
          <li key={v.id} className="border rounded p-2 text-xs flex justify-between items-center">
            <div className="flex-1 mr-2">
              <p className="font-medium">{new Date(v.scheduled_at || v.created_at).toLocaleDateString()}</p>
              <p className="text-gray-600 font-semibold">{getPropertyName(v.property_id)}</p>
              <p className="text-gray-500">Customer: {getUserName(v.user_id)}</p>
            </div>
            <div className="flex items-center space-x-1">
              {statuses.map(s => (
                <button key={s} onClick={()=>update(v.id,s)} className={`px-2 py-1 rounded border text-[10px] ${v.status===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 hover:bg-gray-50'}`}>{s.replace('_',' ')}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewingStatusPanel;
