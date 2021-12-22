document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document
    .querySelector("#compose-btn")
    .addEventListener("click", compose_submit);
  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-content").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function compose_submit() {
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  })
    .then((response) => response.json())
    .then((mail) => {
      mail = "sent";
      load_mailbox(mail);
    });
}

function reply_email(el) {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-content").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  // Fullfil composition fields
  const inner_subject = el.subject.slice(0, 3).toUpperCase();
  document.querySelector("#compose-recipients").value = el.sender;
  if (inner_subject !== "RE:") {
    document.querySelector("#compose-subject").value = "Re: " + el.subject;
  } else {
    document.querySelector("#compose-subject").value = el.subject;
  }
  document.querySelector("#compose-body").value = `${
    `\n\n` +
    "On " +
    el.timestamp +
    " " +
    el.recipients +
    " wrote: " +
    `\n` +
    el.body
  }`;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#email-content").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  // Show the mailbox by name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  if (mailbox === "inbox") {
    document.querySelector("#email-archive").style.display = "inline-block";
    document.querySelector("#email-restore").style.display = "none";
    document.querySelector("#reply").style.display = "inline-block";
    fetch("/emails/inbox")
      .then((response) => response.json())
      .then((emails) => {
        emails.forEach((el) => {
          const email =
            `${el.sender}` +
            `</br>` +
            `${el.subject}` +
            `</br>` +
            `${el.timestamp}`;
          const div = document.createElement("div");
          div.id = el.id;
          div.className = "emails-unit";
          div.innerHTML = email;
          document.querySelector("#emails-view").append(div);
          document.getElementById(div.id).addEventListener("click", () => {
            load_email(el);
            set_read(el);
            document
              .querySelector("#email-archive")
              .addEventListener("click", () => {
                set_view(el);
                window.location.reload();
              });
            document
              .querySelector("#reply")
              .addEventListener("click", () => reply_email(el));
          });
          if (el.read === true) {
            document.getElementById(div.id).style.background = "lightgrey";
          }
        });
      });
  }

  if (mailbox === "sent") {
    document.querySelector("#email-archive").style.display = "none";
    document.querySelector("#email-restore").style.display = "none";
    document.querySelector("#reply").style.display = "none";

    fetch("/emails/sent")
      .then((response) => response.json())
      .then((emails) => {
        emails.forEach((el) => {
          const email =
            `${el.recipients}` +
            `</br>` +
            `${el.subject}` +
            `</br>` +
            `${el.timestamp}`;
          const div = document.createElement("div");
          div.id = el.id;
          div.className = "emails-unit";
          div.innerHTML = email;
          document.querySelector("#emails-view").append(div);
          document.getElementById(div.id).addEventListener("click", () => {
            load_email(el);
          });
        });
      });
  }

  if (mailbox === "archive") {
    document.querySelector("#email-archive").style.display = "none";
    document.querySelector("#reply").style.display = "none";
    document.querySelector("#email-restore").style.display = "inline-block";

    fetch("/emails/archive")
      .then((response) => response.json())
      .then((emails) => {
        emails.forEach((el) => {
          const email = `from: ${el.sender} to: ${el.recipients} </br> ${el.subject} </br> ${el.timestamp}`;
          const div = document.createElement("div");
          div.id = el.id;
          div.className = "emails-unit";
          div.innerHTML = email;
          document.querySelector("#emails-view").append(div);
          document.getElementById(div.id).addEventListener("click", () => {
            load_email(el);
            document
              .querySelector("#email-restore")
              .addEventListener("click", () => {
                set_view(el);
                window.location.reload();
              });
          });
          if (el.read === true) {
            document.getElementById(div.id).style.background = "lightgrey";
          }
        });
      });
  }
}

function load_email(el) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-content").style.display = "block";

  const url = "/emails/" + `${el.id}`;
  fetch(url)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#from").innerHTML = email.sender;
      document.querySelector("#to").innerHTML = email.recipients;
      document.querySelector("#subject").innerHTML = email.subject;
      document.querySelector("#time").innerHTML = email.timestamp;
      document.querySelector("#body").innerHTML = email.body;
    });
}

function set_view(el) {
  const url = "/emails/" + `${el.id}`;
  if (el.archived === true) {
    fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        archived: false,
      }),
    });
  } else {
    fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        archived: true,
      }),
    });
  }
}

function set_read(el) {
  const url = "/emails/" + `${el.id}`;
  fetch(url, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}
