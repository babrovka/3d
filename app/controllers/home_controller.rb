class HomeController < ApplicationController
  def index
  end

  def states
    render json: Construction.all
  end

  def comment
    construction = Construction.first_or_initialize(name: params[:id])
    construction.comment = params[:comment]
    construction.save
  end

  def state
    construction = Construction.first_or_initialize(name: params[:id])
    construction.state = params[:state]
    construction.save
  end
end
