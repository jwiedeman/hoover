const editBtn = document.querySelectorAll('.editButton');
const deleteBtn = document.querySelectorAll('.deleteButton');
const updateBtn = document.querySelector('.updateButton');

for (const button of editBtn) {
  button.addEventListener('click', (e) => {
    document.getElementById('olddomain').value = e.target.dataset.domain;
    document.getElementById('oldcms').value = e.target.dataset.cms;
    document.getElementById('newdomain').value = e.target.dataset.domain;
    document.getElementById('newcms').value = e.target.dataset.cms;
  });
}

for (const button of deleteBtn) {
  button.addEventListener('click', (e) => {
    fetch(`/entity`, {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: e.target.dataset.domain,
        cms: e.target.dataset.cms,
        crawled: e.target.dataset.crawled,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then(() => {
        window.location.reload();
      });
  });
}

updateBtn.addEventListener('click', (e) => {
  e.preventDefault();
  fetch('/entity', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: document.querySelector('#newdomain').value,
      cms: document.querySelector('#newcms').value,
      olddomain: document.querySelector('#olddomain').value,
      oldcms: document.querySelector('#oldcms').value,
    }),
  })
    .then((res) => {
      if (res.ok) return res.json();
    })
    .then(() => {
      window.location.reload();
    });
});


