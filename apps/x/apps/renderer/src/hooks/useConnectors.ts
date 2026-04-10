import { useState, useEffect, useCallback } from "react"
import { getGoogleClientId, setGoogleClientId, clearGoogleClientId } from "@/lib/google-client-id-store"
import { COMPOSIO_DISPLAY_NAMES } from "@x/shared/src/composio.js"
import { toast } from "sonner"

export interface ProviderState {
  isConnected: boolean
  isLoading: boolean
  isConnecting: boolean
}

export interface ProviderStatus {
  error?: string
}

type ComposioToolkitSlug =
  | "gmail"
  | "googlecalendar"
  | "microsoft_outlook"
  | "microsoft_teams"
  | "onedrive"

const ALL_COMPOSIO_TOOLKITS: ComposioToolkitSlug[] = [
  "gmail",
  "googlecalendar",
  "microsoft_outlook",
  "microsoft_teams",
  "onedrive",
]

const MICROSOFT_COMPOSIO_TOOLKITS: ComposioToolkitSlug[] = [
  "microsoft_outlook",
  "microsoft_teams",
  "onedrive",
]

function createInitialComposioStates(): Record<ComposioToolkitSlug, ProviderState> {
  return {
    gmail: { isConnected: false, isLoading: true, isConnecting: false },
    googlecalendar: { isConnected: false, isLoading: true, isConnecting: false },
    microsoft_outlook: { isConnected: false, isLoading: true, isConnecting: false },
    microsoft_teams: { isConnected: false, isLoading: true, isConnecting: false },
    onedrive: { isConnected: false, isLoading: true, isConnecting: false },
  }
}

function getComposioDisplayName(toolkitSlug: ComposioToolkitSlug) {
  return COMPOSIO_DISPLAY_NAMES[toolkitSlug] || toolkitSlug
}

function getComposioSuccessDescription(toolkitSlug: ComposioToolkitSlug) {
  switch (toolkitSlug) {
    case "gmail":
      return "Syncing your emails in the background. This may take a few minutes before changes appear."
    case "googlecalendar":
      return "Syncing your calendar in the background. This may take a few minutes before changes appear."
    default:
      return undefined
  }
}

export function useConnectors(active: boolean) {
  const [providers, setProviders] = useState<string[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>({})
  const [providerStatus, setProviderStatus] = useState<Record<string, ProviderStatus>>({})
  const [googleClientIdOpen, setGoogleClientIdOpen] = useState(false)
  const [googleClientIdDescription, setGoogleClientIdDescription] = useState<string | undefined>(undefined)

  // Granola state
  const [granolaEnabled, setGranolaEnabled] = useState(false)
  const [granolaLoading, setGranolaLoading] = useState(true)

  // Composio API key state
  const [composioApiKeyOpen, setComposioApiKeyOpen] = useState(false)
  const [composioApiKeyTarget, setComposioApiKeyTarget] = useState<ComposioToolkitSlug>("gmail")

  // Slack state
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [slackLoading, setSlackLoading] = useState(true)
  const [slackWorkspaces, setSlackWorkspaces] = useState<Array<{ url: string; name: string }>>([])
  const [slackAvailableWorkspaces, setSlackAvailableWorkspaces] = useState<Array<{ url: string; name: string }>>([])
  const [slackSelectedUrls, setSlackSelectedUrls] = useState<Set<string>>(new Set())
  const [slackPickerOpen, setSlackPickerOpen] = useState(false)
  const [slackDiscovering, setSlackDiscovering] = useState(false)
  const [slackDiscoverError, setSlackDiscoverError] = useState<string | null>(null)

  // Composio toolkit state
  const [composioStates, setComposioStates] = useState<Record<ComposioToolkitSlug, ProviderState>>(
    createInitialComposioStates
  )

  // Composio/Gmail flags
  const [useComposioForGoogle, setUseComposioForGoogle] = useState(false)

  // Composio/Google Calendar flags
  const [useComposioForGoogleCalendar, setUseComposioForGoogleCalendar] = useState(false)

  const setComposioState = useCallback(
    (toolkitSlug: ComposioToolkitSlug, updates: Partial<ProviderState>) => {
      setComposioStates(prev => ({
        ...prev,
        [toolkitSlug]: {
          ...prev[toolkitSlug],
          ...updates,
        },
      }))
    },
    []
  )

  // Load available providers on mount
  useEffect(() => {
    async function loadProviders() {
      try {
        setProvidersLoading(true)
        const result = await window.ipc.invoke('oauth:list-providers', null)
        setProviders(result.providers || [])
      } catch (error) {
        console.error('Failed to get available providers:', error)
        setProviders([])
      } finally {
        setProvidersLoading(false)
      }
    }
    loadProviders()
  }, [])

  // Re-check composio-for-google flags when active
  useEffect(() => {
    if (!active) return
    async function loadComposioForGoogleFlag() {
      try {
        const result = await window.ipc.invoke('composio:use-composio-for-google', null)
        setUseComposioForGoogle(result.enabled)
      } catch (error) {
        console.error('Failed to check composio-for-google flag:', error)
      }
    }
    async function loadComposioForGoogleCalendarFlag() {
      try {
        const result = await window.ipc.invoke('composio:use-composio-for-google-calendar', null)
        setUseComposioForGoogleCalendar(result.enabled)
      } catch (error) {
        console.error('Failed to check composio-for-google-calendar flag:', error)
      }
    }
    loadComposioForGoogleFlag()
    loadComposioForGoogleCalendarFlag()
  }, [active])

  // Load Granola config
  const refreshGranolaConfig = useCallback(async () => {
    try {
      setGranolaLoading(true)
      const result = await window.ipc.invoke('granola:getConfig', null)
      setGranolaEnabled(result.enabled)
    } catch (error) {
      console.error('Failed to load Granola config:', error)
      setGranolaEnabled(false)
    } finally {
      setGranolaLoading(false)
    }
  }, [])

  const handleGranolaToggle = useCallback(async (enabled: boolean) => {
    try {
      setGranolaLoading(true)
      await window.ipc.invoke('granola:setConfig', { enabled })
      setGranolaEnabled(enabled)
      toast.success(enabled ? 'Granola sync enabled' : 'Granola sync disabled')
    } catch (error) {
      console.error('Failed to update Granola config:', error)
      toast.error('Failed to update Granola sync settings')
    } finally {
      setGranolaLoading(false)
    }
  }, [])

  // Slack
  const refreshSlackConfig = useCallback(async () => {
    try {
      setSlackLoading(true)
      const result = await window.ipc.invoke('slack:getConfig', null)
      setSlackEnabled(result.enabled)
      setSlackWorkspaces(result.workspaces || [])
    } catch (error) {
      console.error('Failed to load Slack config:', error)
      setSlackEnabled(false)
      setSlackWorkspaces([])
    } finally {
      setSlackLoading(false)
    }
  }, [])

  const handleSlackEnable = useCallback(async () => {
    setSlackDiscovering(true)
    setSlackDiscoverError(null)
    try {
      const result = await window.ipc.invoke('slack:listWorkspaces', null)
      if (result.error || result.workspaces.length === 0) {
        setSlackDiscoverError(result.error || 'No Slack workspaces found. Set up with: agent-slack auth import-desktop')
        setSlackAvailableWorkspaces([])
        setSlackPickerOpen(true)
      } else {
        setSlackAvailableWorkspaces(result.workspaces)
        setSlackSelectedUrls(new Set(result.workspaces.map((w: { url: string }) => w.url)))
        setSlackPickerOpen(true)
      }
    } catch (error) {
      console.error('Failed to discover Slack workspaces:', error)
      setSlackDiscoverError('Failed to discover Slack workspaces')
      setSlackPickerOpen(true)
    } finally {
      setSlackDiscovering(false)
    }
  }, [])

  const handleSlackSaveWorkspaces = useCallback(async () => {
    const selected = slackAvailableWorkspaces.filter(w => slackSelectedUrls.has(w.url))
    try {
      setSlackLoading(true)
      await window.ipc.invoke('slack:setConfig', { enabled: true, workspaces: selected })
      setSlackEnabled(true)
      setSlackWorkspaces(selected)
      setSlackPickerOpen(false)
      toast.success('Slack enabled')
    } catch (error) {
      console.error('Failed to save Slack config:', error)
      toast.error('Failed to save Slack settings')
    } finally {
      setSlackLoading(false)
    }
  }, [slackAvailableWorkspaces, slackSelectedUrls])

  const handleSlackDisable = useCallback(async () => {
    try {
      setSlackLoading(true)
      await window.ipc.invoke('slack:setConfig', { enabled: false, workspaces: [] })
      setSlackEnabled(false)
      setSlackWorkspaces([])
      setSlackPickerOpen(false)
      toast.success('Slack disabled')
    } catch (error) {
      console.error('Failed to update Slack config:', error)
      toast.error('Failed to update Slack settings')
    } finally {
      setSlackLoading(false)
    }
  }, [])

  // Composio toolkit connections
  const refreshComposioStatus = useCallback(async (toolkitSlug: ComposioToolkitSlug) => {
    try {
      setComposioState(toolkitSlug, { isLoading: true })
      const result = await window.ipc.invoke('composio:get-connection-status', { toolkitSlug })
      setComposioState(toolkitSlug, {
        isConnected: result.isConnected,
        isLoading: false,
        isConnecting: false,
      })
    } catch (error) {
      console.error(`Failed to load ${toolkitSlug} status:`, error)
      setComposioState(toolkitSlug, {
        isConnected: false,
        isLoading: false,
        isConnecting: false,
      })
    }
  }, [setComposioState])

  const startComposioConnect = useCallback(async (toolkitSlug: ComposioToolkitSlug) => {
    const displayName = getComposioDisplayName(toolkitSlug)
    try {
      setComposioState(toolkitSlug, { isConnecting: true, isLoading: false })
      const result = await window.ipc.invoke('composio:initiate-connection', { toolkitSlug })
      if (!result.success) {
        toast.error(result.error || `Failed to connect to ${displayName}`)
        setComposioState(toolkitSlug, { isConnecting: false, isLoading: false })
      }
    } catch (error) {
      console.error(`Failed to connect to ${toolkitSlug}:`, error)
      toast.error(`Failed to connect to ${displayName}`)
      setComposioState(toolkitSlug, { isConnecting: false, isLoading: false })
    }
  }, [setComposioState])

  const handleConnectComposio = useCallback(async (toolkitSlug: ComposioToolkitSlug) => {
    const configResult = await window.ipc.invoke('composio:is-configured', null)
    if (!configResult.configured) {
      setComposioApiKeyTarget(toolkitSlug)
      setComposioApiKeyOpen(true)
      return
    }
    await startComposioConnect(toolkitSlug)
  }, [startComposioConnect])

  const handleDisconnectComposio = useCallback(async (toolkitSlug: ComposioToolkitSlug) => {
    const displayName = getComposioDisplayName(toolkitSlug)
    try {
      setComposioState(toolkitSlug, { isLoading: true })
      const result = await window.ipc.invoke('composio:disconnect', { toolkitSlug })
      if (result.success) {
        setComposioState(toolkitSlug, {
          isConnected: false,
          isLoading: false,
          isConnecting: false,
        })
        toast.success(`Disconnected from ${displayName}`)
      } else {
        toast.error(`Failed to disconnect from ${displayName}`)
        setComposioState(toolkitSlug, { isLoading: false })
      }
    } catch (error) {
      console.error(`Failed to disconnect from ${toolkitSlug}:`, error)
      toast.error(`Failed to disconnect from ${displayName}`)
      setComposioState(toolkitSlug, { isLoading: false })
    }
  }, [setComposioState])

  const refreshGmailStatus = useCallback(() => refreshComposioStatus('gmail'), [refreshComposioStatus])
  const refreshGoogleCalendarStatus = useCallback(() => refreshComposioStatus('googlecalendar'), [refreshComposioStatus])
  const handleConnectGmail = useCallback(() => handleConnectComposio('gmail'), [handleConnectComposio])
  const handleDisconnectGmail = useCallback(() => handleDisconnectComposio('gmail'), [handleDisconnectComposio])
  const handleConnectGoogleCalendar = useCallback(() => handleConnectComposio('googlecalendar'), [handleConnectComposio])
  const handleDisconnectGoogleCalendar = useCallback(() => handleDisconnectComposio('googlecalendar'), [handleDisconnectComposio])

  // Composio API key
  const handleComposioApiKeySubmit = useCallback(async (apiKey: string) => {
    try {
      await window.ipc.invoke('composio:set-api-key', { apiKey })
      setComposioApiKeyOpen(false)
      toast.success('Composio API key saved')
      await startComposioConnect(composioApiKeyTarget)
    } catch (error) {
      console.error('Failed to save Composio API key:', error)
      toast.error('Failed to save API key')
    }
  }, [composioApiKeyTarget, startComposioConnect])

  // OAuth connect/disconnect
  const startConnect = useCallback(async (provider: string, clientId?: string) => {
    setProviderStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], isConnecting: true }
    }))

    try {
      const result = await window.ipc.invoke('oauth:connect', { provider, clientId })

      if (!result.success) {
        toast.error(result.error || (provider === 'rowboat' ? 'Failed to log in to Rowboat' : `Failed to connect to ${provider}`))
        setProviderStates(prev => ({
          ...prev,
          [provider]: { ...prev[provider], isConnecting: false }
        }))
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      toast.error(provider === 'rowboat' ? 'Failed to log in to Rowboat' : `Failed to connect to ${provider}`)
      setProviderStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], isConnecting: false }
      }))
    }
  }, [])

  const handleConnect = useCallback(async (provider: string) => {
    if (provider === 'google') {
      setGoogleClientIdDescription(undefined)
      const existingClientId = getGoogleClientId()
      if (!existingClientId) {
        setGoogleClientIdOpen(true)
        return
      }
      await startConnect(provider, existingClientId)
      return
    }

    await startConnect(provider)
  }, [startConnect])

  const handleGoogleClientIdSubmit = useCallback((clientId: string) => {
    setGoogleClientId(clientId)
    setGoogleClientIdOpen(false)
    setGoogleClientIdDescription(undefined)
    startConnect('google', clientId)
  }, [startConnect])

  const handleDisconnect = useCallback(async (provider: string) => {
    setProviderStates(prev => ({
      ...prev,
      [provider]: { ...prev[provider], isLoading: true }
    }))

    try {
      const result = await window.ipc.invoke('oauth:disconnect', { provider })

      if (result.success) {
        if (provider === 'google') {
          clearGoogleClientId()
        }
        const displayName = provider === 'fireflies-ai' ? 'Fireflies' : provider.charAt(0).toUpperCase() + provider.slice(1)
        toast.success(provider === 'rowboat' ? 'Logged out of Rowboat' : `Disconnected from ${displayName}`)
        setProviderStates(prev => ({
          ...prev,
          [provider]: {
            isConnected: false,
            isLoading: false,
            isConnecting: false,
          }
        }))
      } else {
        toast.error(provider === 'rowboat' ? 'Failed to log out of Rowboat' : `Failed to disconnect from ${provider}`)
        setProviderStates(prev => ({
          ...prev,
          [provider]: { ...prev[provider], isLoading: false }
        }))
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast.error(provider === 'rowboat' ? 'Failed to log out of Rowboat' : `Failed to disconnect from ${provider}`)
      setProviderStates(prev => ({
        ...prev,
        [provider]: { ...prev[provider], isLoading: false }
      }))
    }
  }, [])

  // Refresh all statuses
  const refreshAllStatuses = useCallback(async () => {
    refreshGranolaConfig()
    refreshSlackConfig()

    if (useComposioForGoogle) {
      refreshGmailStatus()
    }

    if (useComposioForGoogleCalendar) {
      refreshGoogleCalendarStatus()
    }

    for (const toolkitSlug of MICROSOFT_COMPOSIO_TOOLKITS) {
      refreshComposioStatus(toolkitSlug)
    }

    if (providers.length === 0) return

    const newStates: Record<string, ProviderState> = {}

    try {
      const result = await window.ipc.invoke('oauth:getState', null)
      const config = result.config || {}
      if (config.google?.clientId) {
        setGoogleClientId(config.google.clientId)
      }
      const statusMap: Record<string, ProviderStatus> = {}

      for (const provider of providers) {
        const providerConfig = config[provider]
        newStates[provider] = {
          isConnected: providerConfig?.connected ?? false,
          isLoading: false,
          isConnecting: false,
        }
        if (providerConfig?.error) {
          statusMap[provider] = { error: providerConfig.error }
        }
      }

      setProviderStatus(statusMap)
    } catch (error) {
      console.error('Failed to check connection statuses:', error)
      for (const provider of providers) {
        newStates[provider] = {
          isConnected: false,
          isLoading: false,
          isConnecting: false,
        }
      }
      setProviderStatus({})
    }

    setProviderStates(newStates)
  }, [
    providers,
    refreshGranolaConfig,
    refreshSlackConfig,
    refreshGmailStatus,
    useComposioForGoogle,
    refreshGoogleCalendarStatus,
    useComposioForGoogleCalendar,
    refreshComposioStatus,
  ])

  // Refresh when active or providers change
  useEffect(() => {
    if (active) {
      refreshAllStatuses()
    }
  }, [active, providers, refreshAllStatuses])

  // Listen for OAuth events
  useEffect(() => {
    const cleanup = window.ipc.on('oauth:didConnect', async (event) => {
      const { provider, success } = event

      setProviderStates(prev => ({
        ...prev,
        [provider]: {
          isConnected: success,
          isLoading: false,
          isConnecting: false,
        }
      }))

      if (success) {
        const displayName = provider === 'fireflies-ai' ? 'Fireflies' : provider.charAt(0).toUpperCase() + provider.slice(1)
        if (provider === 'rowboat') {
          toast.success('Logged in to Rowboat')
        } else if (provider === 'google' || provider === 'fireflies-ai') {
          toast.success(`Connected to ${displayName}`, {
            description: 'Syncing your data in the background. This may take a few minutes before changes appear.',
            duration: 8000,
          })
        } else {
          toast.success(`Connected to ${displayName}`)
        }

        if (provider === 'rowboat') {
          try {
            const [googleResult, calendarResult] = await Promise.all([
              window.ipc.invoke('composio:use-composio-for-google', null),
              window.ipc.invoke('composio:use-composio-for-google-calendar', null),
            ])
            setUseComposioForGoogle(googleResult.enabled)
            setUseComposioForGoogleCalendar(calendarResult.enabled)
          } catch (err) {
            console.error('Failed to re-check composio flags:', err)
          }
        }

        refreshAllStatuses()
      }
    })

    return cleanup
  }, [refreshAllStatuses])

  // Listen for Composio events
  useEffect(() => {
    const cleanup = window.ipc.on('composio:didConnect', (event) => {
      const { toolkitSlug, success, error } = event as {
        toolkitSlug: string
        success: boolean
        error?: string
      }

      if (!ALL_COMPOSIO_TOOLKITS.includes(toolkitSlug as ComposioToolkitSlug)) {
        return
      }

      const typedToolkitSlug = toolkitSlug as ComposioToolkitSlug
      const displayName = getComposioDisplayName(typedToolkitSlug)

      setComposioState(typedToolkitSlug, {
        isConnected: success,
        isLoading: false,
        isConnecting: false,
      })

      if (success) {
        const description = getComposioSuccessDescription(typedToolkitSlug)
        if (description) {
          toast.success(`Connected to ${displayName}`, {
            description,
            duration: 8000,
          })
        } else {
          toast.success(`Connected to ${displayName}`)
        }
      } else {
        toast.error(error || `Failed to connect to ${displayName}`)
      }
    })

    return cleanup
  }, [setComposioState])

  const hasProviderError = Object.values(providerStatus).some(
    (status) => Boolean(status?.error)
  )

  const gmailState = composioStates.gmail
  const googleCalendarState = composioStates.googlecalendar

  return {
    // OAuth providers
    providers,
    providersLoading,
    providerStates,
    providerStatus,
    hasProviderError,
    handleConnect,
    handleDisconnect,
    startConnect,

    // Google client ID modal
    googleClientIdOpen,
    setGoogleClientIdOpen,
    googleClientIdDescription,
    setGoogleClientIdDescription,
    handleGoogleClientIdSubmit,

    // Granola
    granolaEnabled,
    granolaLoading,
    handleGranolaToggle,

    // Composio API key modal
    composioApiKeyOpen,
    setComposioApiKeyOpen,
    composioApiKeyTarget,
    setComposioApiKeyTarget,
    handleComposioApiKeySubmit,

    // Slack
    slackEnabled,
    slackLoading,
    slackWorkspaces,
    slackAvailableWorkspaces,
    slackSelectedUrls,
    setSlackSelectedUrls,
    slackPickerOpen,
    setSlackPickerOpen,
    slackDiscovering,
    slackDiscoverError,
    handleSlackEnable,
    handleSlackSaveWorkspaces,
    handleSlackDisable,

    // Gmail (Composio)
    useComposioForGoogle,
    gmailConnected: gmailState.isConnected,
    gmailLoading: gmailState.isLoading,
    gmailConnecting: gmailState.isConnecting,
    handleConnectGmail,
    handleDisconnectGmail,

    // Google Calendar (Composio)
    useComposioForGoogleCalendar,
    googleCalendarConnected: googleCalendarState.isConnected,
    googleCalendarLoading: googleCalendarState.isLoading,
    googleCalendarConnecting: googleCalendarState.isConnecting,
    handleConnectGoogleCalendar,
    handleDisconnectGoogleCalendar,

    // Generic Composio toolkit state
    composioStates,
    handleConnectComposio,
    handleDisconnectComposio,

    // Refresh
    refreshAllStatuses,
  }
}
