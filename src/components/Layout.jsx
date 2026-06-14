import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF6F0', color: '#2E2720' }}>
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100">
        <div className="max-w-md mx-auto flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${isActive ? 'text-amber-800' : 'text-stone-400'}`
            }
          >
            今日
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${isActive ? 'text-amber-800' : 'text-stone-400'}`
            }
          >
            成长
          </NavLink>
          <NavLink
            to="/weekly"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${isActive ? 'text-amber-800' : 'text-stone-400'}`
            }
          >
            周报
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${isActive ? 'text-amber-800' : 'text-stone-400'}`
            }
          >
            设置
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
