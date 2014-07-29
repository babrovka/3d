class HomeController < ApplicationController
  def index
  end

  def states
    render json: Construction.all
  end

  def comment
    puts params.inspect
    construction = Construction.where(name: params[:id]).first_or_initialize
    construction.comment = params[:comment]
    construction.save
    render text: ''
  end

  def state
    puts params.inspect
    construction = Construction.where(name: params[:id]).first_or_initialize
    construction.state = params[:state] == 'true'
    construction.save
    render text: ''
  end
end
