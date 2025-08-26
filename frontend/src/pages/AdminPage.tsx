export default function AdminPage() {
  return (
    <div className="adminpage">
      <h2>Admin</h2>
      <div className="card" style={{padding:12}}>
        <div>Local taught store tools</div>
        <button onClick={()=>{ localStorage.removeItem('gptu.taught.v1'); alert('Cleared taught items in this browser.'); }}>
          Clear local taught items
        </button>
      </div>
    </div>
  );
}
