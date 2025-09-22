// Simple backend integration - no conflicts
document.addEventListener('DOMContentLoaded', function() {
    fetch('https://x39efpag2i.execute-api.us-east-1.amazonaws.com/dev/health')
        .then(response => response.json())
        .then(data => console.log('Backend connected:', data.message))
        .catch(error => console.log('Backend offline'));
});
