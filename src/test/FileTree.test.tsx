import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTree } from '../ui/components/FileTree'

type MockFileItem = {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

type MockElectronWindow = Window & {
  electron: {
    listFiles: (path: string) => Promise<{ success: boolean; items: MockFileItem[] }>
  }
}

describe('FileTree', () => {
  const mockOnFileSelect = vi.fn()
  const mockOnFileContextMenu = vi.fn()

  const mockRootPath = '/test/project'

  beforeEach(() => {
    mockOnFileSelect.mockClear()
    mockOnFileContextMenu.mockClear()
    ;(window as MockElectronWindow).electron = {
      listFiles: vi.fn(async (path: string) => {
        const trees: Record<string, MockFileItem[]> = {
          '/test/project': [
            { name: 'src', path: '/test/project/src', isDirectory: true, isFile: false },
            { name: 'package.json', path: '/test/project/package.json', isDirectory: false, isFile: true },
          ],
          '/test/project/src': [
            { name: 'components', path: '/test/project/src/components', isDirectory: true, isFile: false },
            { name: 'main.tsx', path: '/test/project/src/main.tsx', isDirectory: false, isFile: true },
          ],
          '/test/project/src/components': [
            { name: 'App.tsx', path: '/test/project/src/components/App.tsx', isDirectory: false, isFile: true },
            { name: 'Sidebar.tsx', path: '/test/project/src/components/Sidebar.tsx', isDirectory: false, isFile: true },
          ],
        }

        return { success: true, items: trees[path] ?? [] }
      }),
    }
  })

  it('renders file tree', async () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    expect(await screen.findByText('src')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()
  })

  it('renders file tree after loading', async () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    fireEvent.click(await screen.findByText('src'))

    expect(await screen.findByText('main.tsx')).toBeInTheDocument()
    expect(screen.getByText('components')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()
  })

  it('calls onFileSelect when file is clicked', async () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    fireEvent.click(await screen.findByText('src'))
    fireEvent.click(await screen.findByText('components'))

    const appTsx = screen.getByText('App.tsx')
    fireEvent.click(appTsx)

    expect(mockOnFileSelect).toHaveBeenCalledWith('/test/project/src/components/App.tsx')
  })

  it('calls onFileContextMenu when right-clicking file', async () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    fireEvent.click(await screen.findByText('src'))
    fireEvent.click(await screen.findByText('components'))

    const sidebarTsx = screen.getByText('Sidebar.tsx')
    fireEvent.contextMenu(sidebarTsx)

    expect(mockOnFileContextMenu).toHaveBeenCalledWith(
      '/test/project/src/components/Sidebar.tsx',
      expect.any(Object)
    )
  })

  it('displays correct file icons', async () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    fireEvent.click(await screen.findByText('src'))
    fireEvent.click(await screen.findByText('components'))

    const srcDir = screen.getByText('src').closest('div')
    expect(srcDir?.textContent).toContain('📂')

    const appTsx = screen.getByText('App.tsx').closest('div')
    expect(appTsx?.textContent).toContain('🔵')

    const packageJson = screen.getByText('package.json').closest('div')
    expect(packageJson?.textContent).toContain('📋')
  })
})
