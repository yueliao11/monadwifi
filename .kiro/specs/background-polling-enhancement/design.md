# Design Document

## Overview

This design implements background polling functionality for the WiFi payment application. The enhancement adds a composable that continuously polls the WiFiDog temporary pass endpoint and automatically redirects users to Baidu when access is granted, while maintaining all existing payment functionality.

## Architecture

### Component Integration
- **App.vue**: Main component that orchestrates polling lifecycle
- **usePolling composable**: New composable managing background polling logic
- **Existing composables**: useWallet and usePayment remain unchanged
- **Existing utils**: wifidog.ts utilities remain available but not used for final redirect

### Data Flow
1. Page loads → Start background polling
2. Polling runs independently of wallet/payment state
3. Success response from endpoint → Redirect to Baidu
4. Component unmount → Cleanup polling

## Components and Interfaces

### New Composable: usePolling

```typescript
interface PollingConfig {
  endpoint: string
  interval: number
  maxRetries?: number
}

interface PollingState {
  isPolling: boolean
  lastChecked: Date | null
  errorCount: number
}

interface PollingResult {
  success: boolean
  shouldRedirect: boolean
  error?: string
}

export function usePolling(config: PollingConfig) {
  // State management
  const state: PollingState
  
  // Core methods
  const startPolling: () => void
  const stopPolling: () => void
  const checkEndpoint: () => Promise<PollingResult>
  
  // Lifecycle
  const cleanup: () => void
  
  return {
    state: readonly(state),
    startPolling,
    stopPolling,
    cleanup
  }
}
```

### Integration Points

**App.vue modifications:**
- Import and initialize usePolling in onMounted
- Configure polling with endpoint URL and 3-second interval
- Handle redirection when polling succeeds
- Cleanup polling in onUnmounted

**Polling Configuration:**
```typescript
const pollingConfig = {
  endpoint: 'http://192.168.1.249:2060/wifidog/temporary_pass',
  interval: 3000, // 3 seconds
  maxRetries: undefined // Infinite retries
}
```

## Data Models

### Polling Configuration
```typescript
interface PollingConfig {
  endpoint: string        // Target URL to poll
  interval: number       // Polling interval in milliseconds
  maxRetries?: number    // Optional retry limit (undefined = infinite)
}
```

### Polling State
```typescript
interface PollingState {
  isPolling: boolean     // Current polling status
  lastChecked: Date | null // Timestamp of last check
  errorCount: number     // Consecutive error count
}
```

### HTTP Response Handling
- **Success indicators**: HTTP 200 status or specific response body content
- **Failure handling**: Network errors, timeouts, non-200 responses
- **Retry logic**: Continue polling on failures without user notification

## Error Handling

### Network Errors
- **Strategy**: Silent failure with continued polling
- **Logging**: Console errors for debugging
- **User Impact**: No UI changes or error messages
- **Recovery**: Automatic retry on next polling cycle

### Endpoint Errors
- **4xx/5xx responses**: Treated as "not ready" state
- **Timeout handling**: Configurable request timeout (10 seconds)
- **CORS issues**: Handled gracefully with fallback behavior

### Resource Management
- **Timer cleanup**: Clear intervals on component unmount
- **Request cancellation**: Abort pending requests on cleanup
- **Memory leaks**: Proper cleanup of event listeners and timers

## Testing Strategy

### Unit Tests
- **usePolling composable**: Test polling lifecycle, error handling, cleanup
- **HTTP mocking**: Mock successful and failed endpoint responses
- **Timer testing**: Verify polling intervals and cleanup

### Integration Tests
- **App.vue integration**: Test polling initialization and cleanup
- **Redirection flow**: Verify Baidu redirect on success
- **Existing functionality**: Ensure wallet/payment features unaffected

### Manual Testing Scenarios
1. **Normal flow**: Page load → polling starts → success → redirect
2. **Network failures**: Verify continued polling during network issues
3. **Payment integration**: Ensure polling works during payment process
4. **Page navigation**: Verify cleanup when leaving page

## Implementation Details

### Polling Implementation
```typescript
// Core polling logic
const checkEndpoint = async (): Promise<PollingResult> => {
  try {
    const response = await fetch(config.endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (response.ok) {
      return { success: true, shouldRedirect: true }
    }
    
    return { success: false, shouldRedirect: false }
  } catch (error) {
    console.error('Polling error:', error)
    return { 
      success: false, 
      shouldRedirect: false, 
      error: error.message 
    }
  }
}
```

### Lifecycle Management
```typescript
// Start polling on component mount
onMounted(() => {
  // Existing wallet check logic...
  
  // Start background polling
  startPolling()
})

// Cleanup on component unmount
onUnmounted(() => {
  cleanup()
})
```

### Redirection Logic
```typescript
// Handle successful polling result
const handlePollingSuccess = () => {
  stopPolling()
  window.location.href = 'https://www.baidu.com'
}
```

## Performance Considerations

### Resource Usage
- **Network requests**: One request every 3 seconds
- **Memory footprint**: Minimal state tracking
- **CPU usage**: Negligible timer overhead

### Optimization Strategies
- **Request deduplication**: Prevent overlapping requests
- **Exponential backoff**: Optional for persistent failures
- **Conditional polling**: Could pause during active payment flows

## Security Considerations

### Cross-Origin Requests
- **CORS handling**: Endpoint must support cross-origin requests
- **Fallback behavior**: Graceful degradation if CORS blocked

### Data Privacy
- **No sensitive data**: Polling requests contain no user information
- **Logging**: Avoid logging sensitive information in errors

## Migration Strategy

### Backward Compatibility
- **Existing features**: All current functionality preserved
- **Configuration**: New polling config added without breaking changes
- **Fallback**: Application works normally if polling fails

### Deployment Considerations
- **Endpoint availability**: Ensure target endpoint is accessible
- **Network configuration**: Verify CORS and firewall settings
- **Monitoring**: Add logging for polling success/failure rates