import { SetStateAction, useState } from 'react'
import { Home, User, LogOut } from 'lucide-react'

function App() {
  const [selectedOption, setSelectedOption] = useState('OverAll Review')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const sidebarOptions = [
    'OverAll Review',
    'Fire',
    'Engineering', 
    'Marine',
    'Liability'
  ]

  const handleOptionClick = (option: SetStateAction<string>) => {
    setSelectedOption(option)
  }

  const handleHomeClick = () => {
    setSelectedOption('OverAll Review')
  }

  const handleLogout = () => {
    // Logout logic would go here
    console.log('Logout clicked')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Insurance Analysis</h2>
          <nav>
            <ul className="space-y-2">
              {sidebarOptions.map((option) => (
                <li key={option}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      selectedOption === option
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1"></div>
            
            {/* Center - Selected Option */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-gray-800">{selectedOption}</h1>
            </div>

            {/* Right Side - Icons */}
            <div className="flex-1 flex justify-end items-center space-x-4">
              <button
                onClick={handleHomeClick}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Home"
              >
                <Home size={20} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="User Menu"
                >
                  <User size={20} />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Content for {selectedOption} will go here...</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App