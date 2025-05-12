
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.1)'; 
        button.style.transition = 'transform 0.3s'; 
        button.style.backgroundColor = 'blue';
    });
    // 
    button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = ''; 
    });
});
