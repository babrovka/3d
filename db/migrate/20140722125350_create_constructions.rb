class CreateConstructions < ActiveRecord::Migration
  def change
    create_table :constructions do |t|
      t.integer :state
      t.string :comment
      t.string :name

      t.timestamps
    end
  end
end
