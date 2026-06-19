import { GoogleLogin } from '@react-oauth/google'

export default function GoogleLoginButton({ onSuccess, onError }) {
  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={(res) => onSuccess(res.credential)}
        onError={onError}
        text="continue_with"
        locale="es"
        shape="rectangular"
        size="large"
        width="360"
        useOneTap={false}
      />
    </div>
  )
}
