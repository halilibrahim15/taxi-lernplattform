function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#eef2f7',
        padding: '32px 20px',
      }}
    >
      {children}
    </div>
  )
}

export default Layout