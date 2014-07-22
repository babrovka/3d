Proto::Application.routes.draw do
  root to: 'home#index'

  get '/states', to: 'home#states'
  post '/comment', to: 'home#comment'
  post '/state', to: 'home#state'
end
