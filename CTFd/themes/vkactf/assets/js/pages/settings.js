import "./main";
import { copyToClipboard } from "../utils";
import $ from "jquery";
import CTFd from "../CTFd";
import { ezAlert, ezQuery } from "../ezq";

const error_template =
  '<div class="alert alert-danger alert-dismissable alert-f text-f" role="alert">\n' +
  '  <span class="sr-only">Error:</span>\n' +
  "  {0}\n" +
  '  <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>\n' +
  "</div>";

const success_template =
  '<div class="alert alert-success alert-dismissable submit-row alert-f text-f" role="alert">\n' +
  "  <strong>Успешно!</strong>\n" +
  "   Ваш профиль обновлен\n" +
  '  <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>\n' +
  "</div>";

function profileUpdate(event) {
  event.preventDefault();
  $("#results").empty();
  const $form = $(this);
  let params = $form.serializeJSON(true);

  params.fields = [];

  for (const property in params) {
    if (property.match(/fields\[\d+\]/)) {
      let field = {};
      let id = parseInt(property.slice(7, -1));
      field["field_id"] = id;
      field["value"] = params[property];
      params.fields.push(field);
      delete params[property];
    }
  }

  CTFd.api.patch_user_private({}, params).then(response => {
    if (response.success) {
      $("#results").html(success_template);
    } else if ("errors" in response) {
      Object.keys(response.errors).map(function(error) {
        const i = $form.find("input[name={0}]".format(error));
        const input = $(i);
        input.addClass("input-filled-invalid");
        input.removeClass("input-filled-valid");
        const error_msg = response.errors[error];
        $("#results").append(error_template.format(error_msg));
      });
    }
  });
}

function tokenGenerate(event) {
  event.preventDefault();
  const $form = $(this);
  let params = $form.serializeJSON(true);

  CTFd.fetch("/api/v1/tokens", {
    method: "POST",
    body: JSON.stringify(params)
  })
    .then(function(response) {
      return response.json();
    })
    .then(function(response) {
      if (response.success) {
        let body = $(`
        <p>Пожалуйста, скопируйте свой ключ API, он больше не будет показан!</p>
        <div class="input-group mb-3">
          <input type="text" id="user-token-result" class="form-control user-input-f" value="${
            response.data.value
          }" readonly>
          <div class="input-group-append">
            <button class="btn invite-btn-f" type="button">
              <span class="icon-f icon-email-f"></span>
            </button>
          </div>
        </div>
        `);
        body.find("button").click(function(event) {
          copyToClipboard(event, "#user-token-result");
        });
        ezAlert({
          title: "API Ключ сгенерирован",
          body: body,
          button: "Понятно!",
          large: true
        });
      }
    });
}

function deleteToken(event) {
  event.preventDefault();
  const $elem = $(this);
  const id = $elem.data("token-id");

  ezQuery({
    title: "Удалить Токен",
    body: "Вы уверены, что хотите удалить этот токен?",
    success: function() {
      CTFd.fetch("/api/v1/tokens/" + id, {
        method: "DELETE"
      })
        .then(function(response) {
          return response.json();
        })
        .then(function(response) {
          if (response.success) {
            $elem
              .parent()
              .parent()
              .remove();
          }
        });
    }
  });
}

$(() => {
  $("#user-profile-form").submit(profileUpdate);
  $("#user-token-form").submit(tokenGenerate);
  $(".delete-token").click(deleteToken);
  $(".nav-pills a").click(function(_event) {
    window.location.hash = this.hash;
  });

  // Load location hash
  let hash = window.location.hash;
  if (hash) {
    hash = hash.replace("<>[]'\"", "");
    $('.nav-pills a[href="' + hash + '"]').tab("show");
  }
});
