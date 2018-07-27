import './styles/modules/login.css'
import $ from 'jquery'
import { btoa, atob } from 'Base64'
import 'jquery-form'
import 'jquery-validation'

$(() => {
  var prevSkin = $.cookie('current-skin')
  if(prevSkin) {
    $('body').removeClass().addClass(prevSkin)
  }
  $('#username').focus()
  $('input').on('change', () => {
    $('.server-error').remove()
  })
  $('#loginform').attr('action', '/tpm/account/login').validate({
    submitHandler: function(form, ev){
      var $form = $(form)
      var $password = $form.find('[name="password"]')
      var $encode = $form.find('[name="encode"]')

      if($encode.length){
        try{
          $password.val(btoa($password.val()))
          $encode.val('true')
        }catch(error){
          throw error
        }
      }
      // $form.submit()
      $form.ajaxSubmit({
        dataType: 'json',
        complete(){
          window.location.href = './'
        }
        // success:(res) => {
          // if(res.result){
          //   let lastPath = window.localStorage.getItem('lastPath')
          //   if(lastPath){
          //     window.location.href = `./${lastPath}`
          //     window.localStorage.clear()
          //   }else{
          //     window.location.href = './'
          //   }
          // }
        // }
      })
    },
    errorLabelContainer: '.field-error',
    rules: {
      username: {
        required: true
      },
      password: {
        required: true
      }
    },
    messages: {
      username: {
        required: __('请输入用户名')
      },
      password: {
        required: __('请输入密码')
      }
    }
  })
})
